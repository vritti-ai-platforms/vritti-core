import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { type RazorpayAuth, RazorpayHttpService } from '@/gateways/razorpay/services/razorpay-http.service';
import {
  type CreateOrderInput,
  type CreateOrderResult,
  GatewayCodeValues,
  type GatewaySplitCapability,
  type NormalizedPayment,
  type NormalizedPaymentStatus,
  type NormalizedWebhookEvent,
  type PaymentGatewayTransport,
  type RefundResult,
  type VerifyCheckoutSignatureInput,
  type VerifyCredentialsResult,
} from '../gateway-transport';
import { toMinorUnitsNumber } from './razorpay-amount';
import { RazorpaySplit, type RazorpayTransfer } from './razorpay-split';

const KEY_ID_FIELD = 'key_id';
const KEY_SECRET_FIELD = 'key_secret';
const SIGNATURE_HEADER = 'x-razorpay-signature';
const EVENT_ID_HEADER = 'x-razorpay-event-id';
const TRANSFER_EVENT_PREFIX = 'transfer.';
// Razorpay rejects an order whose receipt is longer than this
const RECEIPT_MAX_LENGTH = 40;

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string | null;
  status?: string;
  transfers?: RazorpayTransfer[];
}

interface RazorpayPayment {
  id: string;
  order_id?: string | null;
  status?: string;
  amount: number;
  currency: string;
  method?: string | null;
  fee?: number | null;
  tax?: number | null;
  error_code?: string | null;
  error_description?: string | null;
}

interface RazorpayWebhookBody {
  entity?: string;
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPayment };
    order?: { entity?: RazorpayOrder };
    transfer?: { entity?: RazorpayTransfer };
  };
}

const PAYMENT_STATUSES: ReadonlySet<NormalizedPaymentStatus> = new Set([
  'created',
  'authorized',
  'captured',
  'refunded',
  'failed',
]);

// The stock Razorpay gateway. HDFC's edition is a separate copy (HdfcRazorpayTransport) over its own client, so a
// change on either side never reaches the other
export class RazorpayTransport implements PaymentGatewayTransport {
  readonly credentialFields = [KEY_ID_FIELD, KEY_SECRET_FIELD] as const;
  readonly split: GatewaySplitCapability;
  protected readonly logger: Logger;
  protected readonly route: RazorpaySplit;

  readonly code = GatewayCodeValues.RAZORPAY;

  constructor(protected readonly http: RazorpayHttpService) {
    this.logger = new Logger(this.constructor.name);
    this.route = this.createRoute();
    this.split = this.route;
  }

  // Proves the key pair works with a one-row read — Razorpay has no whoami, and an order list is
  // read-only, cheap, and rejected with 401 when the pair is wrong
  async verifyCredentials(credentials: Record<string, string>): Promise<VerifyCredentialsResult> {
    const auth = this.auth(credentials);
    await this.http.get<unknown>(auth, '/orders', { count: 1 }, { credentialField: `credentials.${KEY_SECRET_FIELD}` });
    this.logger.log('Credentials verified');
    return { providerMerchantId: null };
  }

  // Opens a Razorpay order and returns what the checkout widget needs to collect against it.
  // payment_capture: 1 auto-captures on authorization, so no payment sits authorized-but-uncaptured
  // and gets auto-refunded by Razorpay
  async createOrder(credentials: Record<string, string>, input: CreateOrderInput): Promise<CreateOrderResult> {
    const auth = this.auth(credentials);
    assertReceipt(input.receipt);
    const order = await this.http.post<RazorpayOrder>(auth, '/orders', {
      amount: toMinorUnitsNumber(input.amount),
      currency: input.currency,
      receipt: input.receipt,
      payment_capture: 1,
      ...(input.notes ? { notes: input.notes } : {}),
      // Route splits the captured payment by these transfers; the main account keeps what they leave over
      ...(input.transfers?.length
        ? { transfers: input.transfers.map((transfer, index) => this.route.transferBody(transfer, index)) }
        : {}),
    });

    this.logger.log(`Created order ${order.id} for receipt ${input.receipt}`);
    return {
      providerOrderId: order.id,
      checkout: {
        key_id: auth.keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        ...(input.customer
          ? { prefill: { name: input.customer.name, email: input.customer.email, contact: input.customer.phone } }
          : {}),
      },
      transfers: (order.transfers ?? []).map((item, index) =>
        this.route.toTransferResult(item, input.transfers?.[index]),
      ),
    };
  }

  async fetchPayment(credentials: Record<string, string>, providerPaymentId: string): Promise<NormalizedPayment> {
    const auth = this.auth(credentials);
    const payment = await this.http.get<RazorpayPayment>(auth, `/payments/${encodeURIComponent(providerPaymentId)}`);
    return this.normalizePayment(payment);
  }

  // Refunds a captured payment, in full or for part of it — POST /payments/:id/refund, amount in paise
  async refundPayment(
    credentials: Record<string, string>,
    providerPaymentId: string,
    amount: bigint,
  ): Promise<RefundResult> {
    const auth = this.auth(credentials);
    const refund = await this.http.post<{ id: string; status?: string }>(
      auth,
      `/payments/${encodeURIComponent(providerPaymentId)}/refund`,
      { amount: toMinorUnitsNumber(amount) },
    );
    this.logger.log(`Refunded ${amount} of payment ${providerPaymentId} as ${refund.id}`);
    return { providerRefundId: refund.id, status: refund.status ?? 'pending' };
  }

  // Checks the signature the checkout widget hands back: HMAC-SHA256(`order_id|payment_id`, key_secret)
  verifyCheckoutSignature(credentials: Record<string, string>, input: VerifyCheckoutSignatureInput): boolean {
    const auth = this.auth(credentials);
    const expected = hmacHex(auth.keySecret, `${input.providerOrderId}|${input.providerPaymentId}`);
    return safeEqualHex(expected, input.signature);
  }

  // Checks the webhook signature Razorpay sends: HMAC-SHA256(raw body, webhook secret)
  verifyWebhook(webhookSecret: string, rawBody: string, headers: Record<string, string>): boolean {
    const signature = headerValue(headers, SIGNATURE_HEADER);
    if (!signature) return false;
    return safeEqualHex(hmacHex(webhookSecret, rawBody), signature);
  }

  // Razorpay sends exactly one event per delivery. It is deduped on a hash of the signed body; the event id
  // header is kept for tracing only, because it is not covered by the signature
  parseWebhook(rawBody: string, headers: Record<string, string>): NormalizedWebhookEvent[] {
    const body = parseBody(rawBody);
    if (!body.event) {
      throw new BadRequestException({
        label: 'Malformed Webhook',
        detail: 'The webhook body carries no event name, so it cannot be processed.',
      });
    }

    const paymentEntity = body.payload?.payment?.entity;
    const payment = paymentEntity ? this.normalizePayment(paymentEntity) : null;
    const transferEntity = body.event.startsWith(TRANSFER_EVENT_PREFIX) ? body.payload?.transfer?.entity : undefined;
    const transfer = transferEntity ? this.route.normalizeTransfer(transferEntity) : null;

    return [
      {
        // The event id header is not covered by the signature, so dedupe keys on the signed body instead
        dedupeKey: sha256Hex(rawBody),
        providerEventId: headerValue(headers, EVENT_ID_HEADER) ?? sha256Hex(rawBody),
        eventType: body.event,
        payment,
        transfer,
        providerOrderId: body.payload?.order?.entity?.id ?? payment?.providerOrderId ?? null,
        raw: body,
      },
    ];
  }

  // Builds the Route (split payment) capability over this transport's own client
  protected createRoute(): RazorpaySplit {
    return new RazorpaySplit(this.http, (credentials) => this.auth(credentials), this.logger);
  }

  // Maps a Razorpay payment entity onto the gateway-neutral shape; amounts come back as bigint
  protected normalizePayment(payment: RazorpayPayment): NormalizedPayment {
    return {
      providerPaymentId: payment.id,
      providerOrderId: payment.order_id ?? null,
      status: this.normalizeStatus(payment.status),
      amount: BigInt(payment.amount),
      currency: payment.currency,
      method: payment.method ?? null,
      fee: typeof payment.fee === 'number' ? BigInt(payment.fee) : null,
      tax: typeof payment.tax === 'number' ? BigInt(payment.tax) : null,
      errorCode: payment.error_code ?? null,
      errorDescription: payment.error_description ?? null,
      raw: payment,
    };
  }

  // An unrecognised status is left at the neutral `created` rather than guessed either way
  protected normalizeStatus(status: string | undefined): NormalizedPaymentStatus {
    if (status && PAYMENT_STATUSES.has(status as NormalizedPaymentStatus)) {
      return status as NormalizedPaymentStatus;
    }
    this.logger.warn(`Unrecognised payment status "${status ?? ''}" — treating as created`);
    return 'created';
  }

  // Reads the key pair out of the per-call credentials, naming the missing field so the form can show it
  protected auth(credentials: Record<string, string>): RazorpayAuth {
    const keyId = credentials[KEY_ID_FIELD]?.trim();
    const keySecret = credentials[KEY_SECRET_FIELD]?.trim();
    const missing = [...(keyId ? [] : [KEY_ID_FIELD]), ...(keySecret ? [] : [KEY_SECRET_FIELD])];
    if (missing.length > 0) {
      throw new BadRequestException({
        label: 'Gateway Credentials Incomplete',
        detail: 'Razorpay needs both a key id and a key secret. Copy them from the Razorpay dashboard.',
        errors: missing.map((field) => ({ field: `credentials.${field}`, message: 'Required' })),
      });
    }
    return { keyId, keySecret };
  }
}

// Checked before the call so an over-long receipt surfaces as a field error rather than a gateway 400
function assertReceipt(receipt: string): void {
  if (!receipt || receipt.length > RECEIPT_MAX_LENGTH) {
    throw new BadRequestException({
      label: 'Invalid Receipt',
      detail: `The order receipt must be between 1 and ${RECEIPT_MAX_LENGTH} characters long.`,
      errors: [{ field: 'receipt', message: `Must be 1 to ${RECEIPT_MAX_LENGTH} characters` }],
    });
  }
}

function parseBody(rawBody: string): RazorpayWebhookBody {
  try {
    return JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    throw new BadRequestException({
      label: 'Malformed Webhook',
      detail: 'The webhook body is not valid JSON.',
    });
  }
}

// Header names arrive in whatever case the HTTP edge preserved, so the lookup ignores it
function headerValue(headers: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  return key ? headers[key] : undefined;
}

function hmacHex(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

function sha256Hex(message: string): string {
  return createHash('sha256').update(message).digest('hex');
}

// Constant-time comparison; a length mismatch is reported false without touching timingSafeEqual
function safeEqualHex(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
