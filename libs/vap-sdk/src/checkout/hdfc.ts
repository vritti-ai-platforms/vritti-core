import { CheckoutError, type CheckoutPlugin, type OpenCheckoutOptions, type PaymentCheckout } from './index.js';
import { asRecord, asText, type HostedForm, submitHostedForm } from './shared.js';

// HDFC Bank's SmartGateway (the SmartHub kit on Razorpay) — `@vritti/vap-sdk/hdfc`.
//
// Its own copy rather than the Razorpay plugin, so HDFC can move to its own page or provider without touching
// stores on stock Razorpay. The kit documents the hosted (embedded) page only: a form posted to it, the result sent
// to core's callback, which verifies it and returns the shopper to the store.

export const HDFC_EMBEDDED_CHECKOUT_URL = 'https://api.razorpay.com/v1/checkout/embedded';

// The hosted page's form for an intent
export function hdfcCheckoutForm(checkout: PaymentCheckout, opts: OpenCheckoutOptions = {}): HostedForm {
  const base = checkout.options;
  const keyId = asText(base.key_id) ?? asText(base.key);
  const orderId = asText(base.order_id);
  if (!keyId || !orderId) {
    throw new CheckoutError('This payment has no gateway order to pay, so its checkout cannot be opened.');
  }
  const callbackUrl = opts.callbackUrl ?? checkout.callbackUrl;
  if (!callbackUrl) {
    throw new CheckoutError('This payment has nowhere to return to — start the checkout with a return URL.');
  }

  const fields: Record<string, string> = { key_id: keyId, order_id: orderId, callback_url: callbackUrl };
  const put = (name: string, value: unknown) => {
    const text = asText(value);
    if (text !== undefined) fields[name] = text;
  };
  put('amount', base.amount);
  put('currency', base.currency);
  put('name', opts.name ?? base.name);
  put('description', opts.description ?? base.description);
  put('image', opts.image ?? base.image);
  put('cancel_url', opts.cancelUrl ?? checkout.cancelUrl);
  for (const [key, value] of Object.entries(asRecord(base.prefill))) put(`prefill[${key}]`, value);
  for (const [key, value] of Object.entries({ ...asRecord(base.notes), ...(opts.notes ?? {}) })) {
    put(`notes[${key}]`, value);
  }
  return { action: HDFC_EMBEDDED_CHECKOUT_URL, method: 'POST', fields };
}

// The HDFC SmartGateway plugin
export function hdfc(): CheckoutPlugin {
  return {
    gateways: ['hdfc-razorpay'],
    async open(checkout, opts) {
      const form = hdfcCheckoutForm(checkout, opts);
      try {
        submitHostedForm(form);
      } catch (error) {
        throw new CheckoutError((error as Error).message);
      }
      return { kind: 'redirected' };
    },
  };
}
