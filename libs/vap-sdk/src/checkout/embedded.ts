import type { GatewayResponse, PaymentCheckout } from '../core/domains/payments';
import { CheckoutError } from './errors';

/**
 * Razorpay's embedded (hosted) checkout — the flow HDFC's Razorpay integration kit documents.
 *
 * Instead of a modal over the storefront, the browser posts a plain form to Razorpay's checkout page; the
 * customer pays there, and Razorpay posts the result back to `callback_url` on the storefront. The ids of a
 * *failed* payment are not posted back, so the callback URL carries whatever the storefront needs to pick the
 * attempt up again (the payment intent, the order number) in its own query string.
 *
 * Framework-agnostic and safe on both sides: building the form and parsing the callback are pure functions;
 * only `submitEmbeddedCheckout` touches the DOM.
 */

/** Where the embedded checkout form is posted. HDFC-issued keys use the same host — the kit names no other. */
export const RAZORPAY_EMBEDDED_CHECKOUT_URL = 'https://api.razorpay.com/v1/checkout/embedded';

// Bank editions of Razorpay (HDFC's smart gateway) are Razorpay underneath and take the same form
const RAZORPAY_GATEWAYS = new Set(['razorpay', 'hdfc-razorpay']);

export type EmbeddedCheckoutOptions = {
  /** Absolute URL Razorpay posts the result to. Put the payment intent id in its query — see the file note. */
  callbackUrl: string;
  /** Absolute URL Razorpay sends the customer back to if they cancel on its page. */
  cancelUrl?: string;
  /** Merchant name shown on Razorpay's page. */
  name?: string;
  description?: string;
  /** Absolute URL of the merchant logo shown on Razorpay's page. */
  image?: string;
  /** Extra notes, added to whatever the intent's checkout already carries. */
  notes?: Record<string, string>;
};

/** A form to post: render it as hidden inputs, or hand it to `submitEmbeddedCheckout`. */
export type EmbeddedCheckoutForm = {
  action: string;
  method: 'POST';
  fields: Record<string, string>;
};

/** What the gateway posted back to `callback_url`. */
export type CheckoutCallback =
  | { ok: true; gatewayResponse: GatewayResponse }
  | {
      ok: false;
      error: { code?: string; description?: string; reason?: string; source?: string; step?: string };
      /** Present when the gateway reports which order or payment failed (Razorpay's `error[metadata]`). */
      providerOrderId?: string;
      providerPaymentId?: string;
    };

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown): string | undefined {
  if (typeof value === 'string') return value.length > 0 ? value : undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function requireRazorpay(gateway: string): void {
  if (!RAZORPAY_GATEWAYS.has(gateway.toLowerCase())) {
    throw new CheckoutError(`This storefront cannot open a "${gateway}" embedded checkout yet.`);
  }
}

/**
 * The form that opens Razorpay's embedded checkout for an intent.
 *
 * Built from `intent.checkout` (which core fills with the key id, the gateway order, the amount in paise, the
 * currency and the prefill) plus what only the storefront knows: where to come back to and what to call itself.
 * Nested values are flattened the way Razorpay's form API reads them — `prefill[email]`, `notes[reference]`.
 */
export function embeddedCheckout(checkout: PaymentCheckout, opts: EmbeddedCheckoutOptions): EmbeddedCheckoutForm {
  requireRazorpay(checkout.gateway);
  const base = checkout.options;

  const keyId = asText(base.key_id) ?? asText(base.key);
  const orderId = asText(base.order_id);
  if (!keyId || !orderId) {
    throw new CheckoutError('This payment has no gateway order to pay, so its checkout cannot be opened.');
  }

  const fields: Record<string, string> = {
    key_id: keyId,
    order_id: orderId,
    callback_url: opts.callbackUrl,
  };
  const put = (name: string, value: unknown) => {
    const text = asText(value);
    if (text !== undefined) fields[name] = text;
  };

  put('amount', base.amount);
  put('currency', base.currency);
  put('name', opts.name ?? base.name);
  put('description', opts.description ?? base.description);
  put('image', opts.image ?? base.image);
  put('cancel_url', opts.cancelUrl);
  for (const [key, value] of Object.entries(asRecord(base.prefill))) put(`prefill[${key}]`, value);
  for (const [key, value] of Object.entries({ ...asRecord(base.notes), ...(opts.notes ?? {}) })) {
    put(`notes[${key}]`, value);
  }

  return { action: RAZORPAY_EMBEDDED_CHECKOUT_URL, method: 'POST', fields };
}

/**
 * Posts an embedded checkout form from the browser, leaving the page for the gateway's.
 *
 * A real form submission rather than `fetch`: the customer has to land on the gateway's page.
 */
export function submitEmbeddedCheckout(form: EmbeddedCheckoutForm): void {
  if (typeof document === 'undefined') {
    throw new CheckoutError('submitEmbeddedCheckout runs in a browser — call it from client code.');
  }
  const element = document.createElement('form');
  element.method = form.method;
  element.action = form.action;
  element.style.display = 'none';
  for (const [name, value] of Object.entries(form.fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    element.appendChild(input);
  }
  document.body.appendChild(element);
  element.submit();
}

type CallbackBody = URLSearchParams | FormData | Record<string, string | undefined>;

function reader(body: CallbackBody): (name: string) => string | undefined {
  if (body instanceof URLSearchParams) return (name) => body.get(name) ?? undefined;
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return (name) => {
      const value = body.get(name);
      return typeof value === 'string' && value.length > 0 ? value : undefined;
    };
  }
  const record = body as Record<string, string | undefined>;
  return (name) => record[name] || undefined;
}

/**
 * Reads what the gateway posted to `callback_url`.
 *
 * Success carries the three values core verifies (`confirmPayment`): nothing here is trusted until core has
 * checked the signature and read the payment back from the gateway. Failure carries Razorpay's `error[...]`
 * fields; the payment and order ids come only from `error[metadata]`, when present.
 */
export function parseCheckoutCallback(gateway: string, body: CallbackBody): CheckoutCallback {
  requireRazorpay(gateway);
  const read = reader(body);

  const paymentId = read('razorpay_payment_id');
  const orderId = read('razorpay_order_id');
  const signature = read('razorpay_signature');
  if (paymentId && orderId && signature) {
    return { ok: true, gatewayResponse: { orderId, paymentId, signature } };
  }

  let metadata: Record<string, unknown> = {};
  const rawMetadata = read('error[metadata]');
  if (rawMetadata) {
    try {
      metadata = asRecord(JSON.parse(rawMetadata));
    } catch {
      metadata = {};
    }
  }

  return {
    ok: false,
    error: {
      code: read('error[code]'),
      description: read('error[description]'),
      reason: read('error[reason]'),
      source: read('error[source]'),
      step: read('error[step]'),
    },
    providerOrderId: asText(metadata.order_id) ?? orderId,
    providerPaymentId: asText(metadata.payment_id) ?? paymentId,
  };
}
