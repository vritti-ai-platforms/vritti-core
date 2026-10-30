import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { type CashfreeAuth, CashfreeHttpService } from '@/gateways/cashfree/services/cashfree-http.service';
import {
  type CreateOrderInput,
  type CreateOrderResult,
  GatewayCodeValues,
  type NormalizedPayment,
  type NormalizedPaymentStatus,
  type NormalizedWebhookEvent,
  type PaymentGatewayTransport,
  type VerifyCredentialsResult,
} from '../gateway-transport';
import { CASHFREE_CURRENCY, toMajorUnits, toMinorUnits } from './cashfree-amount';
import { CashfreeSplit } from './cashfree-split';

const APP_ID_FIELD = 'app_id';
const SECRET_KEY_FIELD = 'secret_key';
const SIGNATURE_HEADER = 'x-webhook-signature';
const TIMESTAMP_HEADER = 'x-webhook-timestamp';
const ORDER_ID_PREFIX = 'vp_';
// Cashfree's limits on an order id and a return url
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{3,45}$/;
const RETURN_URL_MAX_LENGTH = 250;
const NOTIFY_URL_MAX_LENGTH = 250;
// Cashfree wants a ten-digit phone, or an international one led by +
const INDIAN_PHONE = /^[6-9]\d{9}$/;
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 100;
const HTTP_CONFLICT = 409;
const HTTP_NOT_FOUND = 404;

interface CashfreeOrder {
  cf_order_id?: string | number;
  order_id: string;
  order_amount?: number;
  order_currency?: string;
  order_status?: string;
  payment_session_id?: string;
}

interface CashfreePayment {
  cf_payment_id?: string | number;
  order_id?: string;
  payment_status?: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_group?: string | null;
  payment_message?: string | null;
}

interface CashfreeErrorDetails {
  error_code?: string | null;
  error_description?: string | null;
}

interface CashfreeWebhookBody {
  type?: string;
  event_time?: string;
  data?: {
    order?: { order_id?: string; order_amount?: number; order_currency?: string };
    payment?: CashfreePayment;
    error_details?: CashfreeErrorDetails | null;
  };
}

// Cashfree's payment states, as the platform's. A dropped, cancelled or voided payment did not take the money, so it
// is a failure of that attempt; the intent stays payable by another
const PAYMENT_STATUSES: Readonly<Record<string, NormalizedPaymentStatus>> = {
  SUCCESS: 'captured',
  FAILED: 'failed',
  USER_DROPPED: 'failed',
  CANCELLED: 'failed',
  VOID: 'failed',
  PENDING: 'created',
  NOT_ATTEMPTED: 'created',
};

// Cashfree Payments. A payment is split with Easy Split: the vendors' shares travel on the order as order_splits and
// Cashfree settles them once the payment succeeds, so nothing is transferred afterwards. Vendors are added in the
// Cashfree dashboard and entered as payout accounts by their vendor id. Cashfree's checkout hands the browser no
// signed result, so a payment is completed by its signed webhook alone — the browser only comes back to the store.
// Each order names core's webhook route for its org and config in order_meta.notify_url, so those webhooks arrive
// without any URL set in the Cashfree dashboard.
export class CashfreeTransport implements PaymentGatewayTransport {
  readonly code = GatewayCodeValues.CASHFREE;
  readonly credentialFields = [APP_ID_FIELD, SECRET_KEY_FIELD] as const;
  readonly split: CashfreeSplit;
  private readonly logger = new Logger(CashfreeTransport.name);

  constructor(private readonly http: CashfreeHttpService) {
    this.split = new CashfreeSplit(http, (credentials) => this.auth(credentials), this.logger);
  }

  // Proves the key pair works by looking up an order that cannot exist: Cashfree answers 404 to good keys and 401
  // to bad ones, and nothing is created
  async verifyCredentials(credentials: Record<string, string>): Promise<VerifyCredentialsResult> {
    const auth = this.auth(credentials);
    await this.http.get<CashfreeOrder>(auth, `/orders/${ORDER_ID_PREFIX}credential_check`, {
      credentialField: `credentials.${SECRET_KEY_FIELD}`,
      tolerate: [HTTP_NOT_FOUND],
    });
    this.logger.log(`Credentials verified (${this.http.environmentOf(auth)})`);
    return { providerMerchantId: null };
  }

  // Opens a Cashfree order and returns the payment session the browser's checkout opens. The order id is derived
  // from the intent, so a retry after a timeout finds the order the first call opened instead of a second one
  async createOrder(credentials: Record<string, string>, input: CreateOrderInput): Promise<CreateOrderResult> {
    const auth = this.auth(credentials);
    if (input.currency !== CASHFREE_CURRENCY) {
      throw new BadRequestException({
        label: 'Currency Not Supported',
        detail: `Cashfree takes payments in ${CASHFREE_CURRENCY} only.`,
        errors: [{ field: 'currency', message: `Must be ${CASHFREE_CURRENCY}` }],
      });
    }
    const orderId = cashfreeOrderId(input);
    const splits = this.split.orderSplits(input.transfers);
    const returnUrl = input.returnUrl && input.returnUrl.length <= RETURN_URL_MAX_LENGTH ? input.returnUrl : undefined;
    // This order's payment webhooks go to core's route for its org and config, so no dashboard setup is needed
    const notifyUrl = input.notifyUrl && input.notifyUrl.length <= NOTIFY_URL_MAX_LENGTH ? input.notifyUrl : undefined;
    const orderMeta = {
      ...(returnUrl ? { return_url: returnUrl } : {}),
      ...(notifyUrl ? { notify_url: notifyUrl } : {}),
    };

    const created = await this.http.post<CashfreeOrder>(
      auth,
      '/orders',
      {
        order_id: orderId,
        order_amount: toMajorUnits(input.amount),
        order_currency: input.currency,
        customer_details: customerDetails(input),
        ...(Object.keys(orderMeta).length > 0 ? { order_meta: orderMeta } : {}),
        ...(input.notes ? { order_tags: input.notes } : {}),
        ...(splits.length > 0 ? { order_splits: splits } : {}),
      },
      { tolerate: [HTTP_CONFLICT] },
    );
    // A 409 means an earlier call opened this order already; its session is read back rather than a second order made
    const order = created ?? (await this.http.get<CashfreeOrder>(auth, `/orders/${encodeURIComponent(orderId)}`));
    if (!order?.payment_session_id) {
      throw new BadRequestException({
        label: 'Checkout Not Available',
        detail: 'Cashfree opened the order without a payment session, so it cannot be paid. Start the checkout again.',
      });
    }

    this.logger.log(`${created ? 'Created' : 'Reused'} order ${order.order_id} for receipt ${input.receipt}`);
    return {
      providerOrderId: order.order_id,
      checkout: {
        order_id: order.order_id,
        payment_session_id: order.payment_session_id,
        mode: this.http.environmentOf(auth),
      },
      transfers: this.split.sentTransfers(order.order_id, input.transfers),
    };
  }

  // Cashfree reads a payment only under its order, which this call is not given; its payments arrive by webhook
  async fetchPayment(): Promise<NormalizedPayment> {
    throw new BadRequestException({
      label: 'Confirmed By Webhook',
      detail: 'Cashfree payments are completed by their webhook, not by the browser.',
    });
  }

  // Cashfree's checkout returns no signature to check, so a browser confirmation is never trusted
  verifyCheckoutSignature(): boolean {
    return false;
  }

  // Cashfree signs Base64(HMAC-SHA256(timestamp + raw body)) with the merchant's secret key, which is therefore what
  // the config's webhook secret holds
  verifyWebhook(webhookSecret: string, rawBody: string, headers: Record<string, string>): boolean {
    const signature = headerValue(headers, SIGNATURE_HEADER);
    const timestamp = headerValue(headers, TIMESTAMP_HEADER);
    if (!signature || !timestamp) return false;
    const expected = createHmac('sha256', webhookSecret).update(`${timestamp}${rawBody}`).digest('base64');
    return safeEqual(expected, signature);
  }

  // One event per delivery, deduped on a hash of the signed body. Only payment events carry a payment; refund,
  // settlement and split events are recorded and left alone
  parseWebhook(rawBody: string): NormalizedWebhookEvent[] {
    const body = parseBody(rawBody);
    if (!body.type) {
      throw new BadRequestException({
        label: 'Malformed Webhook',
        detail: 'The webhook body carries no event type, so it cannot be processed.',
      });
    }

    const orderId = body.data?.order?.order_id ?? body.data?.payment?.order_id ?? null;
    const payment =
      body.data?.payment?.cf_payment_id !== undefined && orderId
        ? this.normalizePayment(body.data.payment, orderId, body.data.error_details ?? null)
        : null;
    const dedupeKey = sha256Hex(rawBody);

    return [
      {
        dedupeKey,
        providerEventId: payment ? `${body.type}:${payment.providerPaymentId}` : dedupeKey,
        eventType: body.type,
        payment,
        transfer: null,
        providerOrderId: orderId,
        raw: body,
      },
    ];
  }

  private normalizePayment(
    payment: CashfreePayment,
    orderId: string,
    errorDetails: CashfreeErrorDetails | null,
  ): NormalizedPayment {
    return {
      providerPaymentId: String(payment.cf_payment_id),
      providerOrderId: orderId,
      status: this.normalizeStatus(payment.payment_status),
      amount: toMinorUnits(payment.payment_amount),
      currency: payment.payment_currency ?? CASHFREE_CURRENCY,
      method: payment.payment_group ?? null,
      fee: null,
      tax: null,
      errorCode: errorDetails?.error_code ?? null,
      errorDescription: errorDetails?.error_description ?? payment.payment_message ?? null,
      raw: payment,
    };
  }

  // An unrecognised status is left at the neutral `created` rather than guessed either way
  private normalizeStatus(status: string | undefined): NormalizedPaymentStatus {
    const normalized = status ? PAYMENT_STATUSES[status] : undefined;
    if (normalized) return normalized;
    this.logger.warn(`Unrecognised payment status "${status ?? ''}" — treating as created`);
    return 'created';
  }

  // Reads the key pair out of the per-call credentials, naming the missing field so the form can show it
  private auth(credentials: Record<string, string>): CashfreeAuth {
    const appId = credentials[APP_ID_FIELD]?.trim();
    const secretKey = credentials[SECRET_KEY_FIELD]?.trim();
    const missing = [...(appId ? [] : [APP_ID_FIELD]), ...(secretKey ? [] : [SECRET_KEY_FIELD])];
    if (missing.length > 0) {
      throw new BadRequestException({
        label: 'Gateway Credentials Incomplete',
        detail: 'Cashfree needs both an app id and a secret key. Copy them from the Cashfree dashboard.',
        errors: missing.map((field) => ({ field: `credentials.${field}`, message: 'Required' })),
      });
    }
    return { appId, secretKey };
  }
}

// The intent's id without dashes, so every intent has its own Cashfree order and a retry of it reuses that order
function cashfreeOrderId(input: CreateOrderInput): string {
  const base = input.paymentIntentId ? input.paymentIntentId.replaceAll('-', '') : input.receipt;
  const orderId = `${ORDER_ID_PREFIX}${base}`;
  if (!ORDER_ID_PATTERN.test(orderId)) {
    throw new BadRequestException({
      label: 'Invalid Receipt',
      detail: 'Cashfree order ids are 3 to 45 letters, digits, dashes or underscores.',
      errors: [{ field: 'receipt', message: 'Not a valid Cashfree order id' }],
    });
  }
  return orderId;
}

// Cashfree requires a customer id and phone on every order. The id is derived from the contact details, so one
// shopper keeps one id without the platform's own ids leaving it
function customerDetails(input: CreateOrderInput): Record<string, string> {
  const phone = cashfreePhone(input.customer?.phone);
  if (!phone) {
    throw new BadRequestException({
      label: 'Phone Number Required',
      detail: "Cashfree needs the shopper's mobile number. Add one to the shopper's profile and pay again.",
      errors: [{ field: 'customer.phone', message: 'Required by Cashfree' }],
    });
  }
  const email = input.customer?.email?.trim();
  const name = input.customer?.name?.trim().slice(0, NAME_MAX_LENGTH);
  return {
    customer_id: `cust_${sha256Hex(`${phone}|${email ?? ''}`).slice(0, 32)}`,
    customer_phone: phone,
    ...(email ? { customer_email: email } : {}),
    ...(name && name.length >= NAME_MIN_LENGTH ? { customer_name: name } : {}),
  };
}

// A ten-digit Indian mobile with its +91 or 0 dropped, or an international number kept with its +
function cashfreePhone(phone: string | undefined): string | undefined {
  const compact = phone?.replace(/[\s()-]/g, '');
  if (!compact) return undefined;
  const local = compact.replace(/^(\+91|0091|91|0)(?=\d{10}$)/, '');
  if (INDIAN_PHONE.test(local)) return local;
  return /^\+\d{8,15}$/.test(compact) ? compact : undefined;
}

function parseBody(rawBody: string): CashfreeWebhookBody {
  try {
    return JSON.parse(rawBody) as CashfreeWebhookBody;
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

function sha256Hex(message: string): string {
  return createHash('sha256').update(message).digest('hex');
}

// Constant-time comparison; a length mismatch is reported false without touching timingSafeEqual
function safeEqual(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
