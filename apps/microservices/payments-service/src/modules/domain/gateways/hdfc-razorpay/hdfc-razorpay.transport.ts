import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import {
  type HdfcRazorpayAuth,
  HdfcRazorpayHttpService,
} from '@/gateways/hdfc-razorpay/services/hdfc-razorpay-http.service';
import {
  type CreateOrderInput,
  type CreateOrderResult,
  GatewayCodeValues,
  type NormalizedPayment,
  type NormalizedPaymentStatus,
  type NormalizedWebhookEvent,
  type PaymentGatewayTransport,
  type VerifyCheckoutSignatureInput,
  type VerifyCredentialsResult,
} from '../gateway-transport';
import { toMinorUnitsNumber } from './hdfc-razorpay-amount';

const KEY_ID_FIELD = 'key_id';
const KEY_SECRET_FIELD = 'key_secret';
const SIGNATURE_HEADER = 'x-razorpay-signature';
const EVENT_ID_HEADER = 'x-razorpay-event-id';
// Razorpay rejects an order whose receipt is longer than this
const RECEIPT_MAX_LENGTH = 40;

interface HdfcRazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string | null;
  status?: string;
}

interface HdfcRazorpayPayment {
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

interface HdfcRazorpayWebhookBody {
  entity?: string;
  event?: string;
  payload?: {
    payment?: { entity?: HdfcRazorpayPayment };
    order?: { entity?: HdfcRazorpayOrder };
  };
}

const PAYMENT_STATUSES: ReadonlySet<NormalizedPaymentStatus> = new Set([
  'created',
  'authorized',
  'captured',
  'refunded',
  'failed',
]);

// HDFC Bank's edition of Razorpay (the SmartHub VAS integration kit). A full copy of the stock Razorpay transport,
// not a subclass: HDFC keeps its own code, client, versions and behaviour, and can move to another provider
// without touching merchants on plain Razorpay. The kit has no Route, so this gateway cannot split a payment:
// it has no split capability and refuses an order that carries transfers
export class HdfcRazorpayTransport implements PaymentGatewayTransport {
  readonly credentialFields = [KEY_ID_FIELD, KEY_SECRET_FIELD] as const;
  protected readonly logger: Logger;

  readonly code = GatewayCodeValues.HDFC_RAZORPAY;

  constructor(protected readonly http: HdfcRazorpayHttpService) {
    this.logger = new Logger(this.constructor.name);
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
    if (input.transfers?.length) {
      throw new BadRequestException({
        label: 'Split Payments Unsupported',
        detail: "HDFC's gateway cannot split a payment, so the whole amount stays in its merchant account.",
        errors: [{ field: 'transfers', message: 'Not supported by this gateway' }],
      });
    }
    const order = await this.http.post<HdfcRazorpayOrder>(auth, '/orders', {
      amount: toMinorUnitsNumber(input.amount),
      currency: input.currency,
      receipt: input.receipt,
      payment_capture: 1,
      ...(input.notes ? { notes: input.notes } : {}),
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
      transfers: [],
    };
  }

  async fetchPayment(credentials: Record<string, string>, providerPaymentId: string): Promise<NormalizedPayment> {
    const auth = this.auth(credentials);
    const payment = await this.http.get<HdfcRazorpayPayment>(
      auth,
      `/payments/${encodeURIComponent(providerPaymentId)}`,
    );
    return this.normalizePayment(payment);
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

    return [
      {
        // The event id header is not covered by the signature, so dedupe keys on the signed body instead
        dedupeKey: sha256Hex(rawBody),
        providerEventId: headerValue(headers, EVENT_ID_HEADER) ?? sha256Hex(rawBody),
        eventType: body.event,
        payment,
        // HDFC's edition has no Route, so no event ever names a transfer
        transfer: null,
        providerOrderId: body.payload?.order?.entity?.id ?? payment?.providerOrderId ?? null,
        raw: body,
      },
    ];
  }

  // Maps a Razorpay payment entity onto the gateway-neutral shape; amounts come back as bigint
  protected normalizePayment(payment: HdfcRazorpayPayment): NormalizedPayment {
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
  protected auth(credentials: Record<string, string>): HdfcRazorpayAuth {
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

function parseBody(rawBody: string): HdfcRazorpayWebhookBody {
  try {
    return JSON.parse(rawBody) as HdfcRazorpayWebhookBody;
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
