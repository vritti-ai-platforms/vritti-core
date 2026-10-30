import {
  CheckoutDismissedError,
  CheckoutError,
  CheckoutFailedError,
  type CheckoutPlugin,
  type GatewayResponse,
  type OpenCheckoutOptions,
  type PaymentCheckout,
} from './index.js';
import { asRecord, asText, type HostedForm, loadScript, requireBrowser, submitHostedForm } from './shared.js';

// Razorpay's checkout — `@vritti/vap-sdk/razorpay`.
//
// `embedded` (default) posts a form to Razorpay's hosted page; the result goes to core's callback, which verifies it
// and returns the shopper to the store. `modal` opens checkout.js on the page and resolves with the response, which
// the store hands to `confirmPaymentAction`.

export const RAZORPAY_EMBEDDED_CHECKOUT_URL = 'https://api.razorpay.com/v1/checkout/embedded';
const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

export type RazorpayPluginOptions = {
  mode?: 'embedded' | 'modal';
};

export type EmbeddedCheckoutOptions = OpenCheckoutOptions;
export type EmbeddedCheckoutForm = HostedForm;

// Razorpay and its bank editions take this form; anything else is refused rather than posted to the wrong page
const EMBEDDED_GATEWAYS = new Set(['razorpay', 'hdfc-razorpay']);

// The hosted page's form for an intent
export function embeddedCheckout(checkout: PaymentCheckout, opts: EmbeddedCheckoutOptions = {}): EmbeddedCheckoutForm {
  if (!EMBEDDED_GATEWAYS.has(checkout.gateway.toLowerCase())) {
    throw new CheckoutError(`This storefront cannot open a "${checkout.gateway}" embedded checkout yet.`);
  }
  const base = checkout.options;
  const keyId = asText(base.key_id) ?? asText(base.key);
  const orderId = asText(base.order_id);
  if (!keyId || !orderId) {
    throw new CheckoutError('This payment has no gateway order to pay, so its checkout cannot be opened.');
  }
  const callbackUrl = opts.callbackUrl ?? checkout.callbackUrl;
  if (!callbackUrl) {
    throw new CheckoutError(
      'This payment has nowhere to return to — start the checkout with a return URL to use the embedded page.',
    );
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
  return { action: RAZORPAY_EMBEDDED_CHECKOUT_URL, method: 'POST', fields };
}

// Posts the hosted page's form, leaving the page for Razorpay's
export function submitEmbeddedCheckout(form: EmbeddedCheckoutForm): void {
  try {
    submitHostedForm(form);
  } catch (error) {
    throw new CheckoutError((error as Error).message);
  }
}

// ── checkout.js modal ────────────────────────────────────────────────────────────────────────────

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailure {
  error?: { code?: string; description?: string; reason?: string };
}

interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: 'payment.failed', handler: (response: RazorpayFailure) => void): void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

async function loadRazorpay(): Promise<RazorpayConstructor> {
  try {
    requireBrowser('The Razorpay checkout');
    await loadScript(RAZORPAY_SCRIPT);
  } catch (error) {
    throw new CheckoutError((error as Error).message);
  }
  const loaded = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (!loaded) throw new CheckoutError('The payment window could not be loaded. Check your connection and try again.');
  return loaded;
}

// Opens checkout.js for an intent; resolves with what core needs to confirm it, rejects on dismiss or failure
export async function openRazorpayModal(
  checkout: PaymentCheckout,
  opts: OpenCheckoutOptions = {},
): Promise<GatewayResponse> {
  const Razorpay = await loadRazorpay();
  const base = checkout.options;

  return new Promise<GatewayResponse>((resolve, reject) => {
    let settled = false;
    const settle = (finish: () => void) => {
      if (settled) return;
      settled = true;
      finish();
    };

    const instance = new Razorpay({
      ...base,
      // Core names it the way Razorpay's server API does; checkout.js reads `key`
      key: base.key ?? base.key_id,
      ...(opts.name !== undefined ? { name: opts.name } : {}),
      ...(opts.description !== undefined ? { description: opts.description } : {}),
      ...(opts.image !== undefined ? { image: opts.image } : {}),
      ...(opts.theme ? { theme: { ...asRecord(base.theme), ...opts.theme } } : {}),
      handler: (response: RazorpaySuccess) =>
        settle(() =>
          resolve({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        ),
      modal: {
        ...asRecord(base.modal),
        ondismiss: () => settle(() => reject(new CheckoutDismissedError())),
      },
    });

    instance.on('payment.failed', (response) => {
      settle(() => {
        // Closed so the promise and the modal agree: a retry inside a modal nobody is listening to would take the
        // money with no handler left to confirm it
        instance.close();
        reject(new CheckoutFailedError(response.error?.code, response.error?.description, response.error?.reason));
      });
    });

    instance.open();
  });
}

// The Razorpay plugin
export function razorpay(options: RazorpayPluginOptions = {}): CheckoutPlugin {
  const mode = options.mode ?? 'embedded';
  return {
    gateways: ['razorpay'],
    async open(checkout, opts) {
      if (mode === 'embedded') {
        submitEmbeddedCheckout(embeddedCheckout(checkout, opts));
        return { kind: 'redirected' };
      }
      try {
        return { kind: 'completed', gatewayResponse: await openRazorpayModal(checkout, opts) };
      } catch (error) {
        if (error instanceof CheckoutDismissedError) return { kind: 'dismissed' };
        throw error;
      }
    },
  };
}
