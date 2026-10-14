import type { GatewayResponse, PaymentCheckout } from '../core/domains/payments';
import { CheckoutDismissedError, CheckoutError, CheckoutFailedError } from './errors';

/**
 * Opening a gateway's checkout in the browser — `@vritti/vap-sdk/checkout`.
 *
 * **Browser-only and framework-agnostic.** No Node builtin, no React, no server import: call it from a
 * React click handler, a Vue method or a plain `<script>` alike. The server side (creating the intent,
 * confirming it) stays with the signed SDK; this only turns `intent.checkout` into a
 * `GatewayResponse` to hand back to it.
 *
 * ```ts
 * try {
 *   const gatewayResponse = await openCheckout(state.checkout, { name: 'My Shop' });
 *   await confirmPaymentAction({ paymentIntentId: state.paymentIntentId, gatewayResponse });
 * } catch (error) {
 *   if (error instanceof CheckoutDismissedError) return; // they closed it — nothing failed
 *   if (error instanceof CheckoutFailedError) show(error.description);
 * }
 * ```
 */

export type { GatewayResponse, PaymentCheckout };
export {
  type CheckoutCallback,
  type EmbeddedCheckoutForm,
  type EmbeddedCheckoutOptions,
  embeddedCheckout,
  parseCheckoutCallback,
  RAZORPAY_EMBEDDED_CHECKOUT_URL,
  submitEmbeddedCheckout,
} from './embedded';
export { CheckoutDismissedError, CheckoutError, CheckoutFailedError } from './errors';

export type OpenCheckoutOptions = {
  /** Shown as the merchant name in the gateway's modal. Overrides whatever the payload carried. */
  name?: string;
  description?: string;
  theme?: { color?: string };
};

// ── Razorpay ─────────────────────────────────────────────────────────────────────────────────────
// The slice of checkout.js this file uses, typed here rather than pulled from a types package.

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

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

type RazorpayWindow = { Razorpay?: RazorpayConstructor };

let razorpayLoading: Promise<RazorpayConstructor> | undefined;

/**
 * checkout.js, loaded once per page however many times `openCheckout` runs.
 *
 * A failed load clears the memo so the next attempt fetches again — a flaky network should not
 * leave the page unable to pay until it is reloaded.
 */
function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new CheckoutError('openCheckout runs in a browser — call it from client code.'));
  }
  const ready = (window as unknown as RazorpayWindow).Razorpay;
  if (ready) return Promise.resolve(ready);

  razorpayLoading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const fail = () => {
      razorpayLoading = undefined;
      reject(new CheckoutError('The payment window could not be loaded. Check your connection and try again.'));
    };
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => {
      const loaded = (window as unknown as RazorpayWindow).Razorpay;
      if (loaded) resolve(loaded);
      else fail();
    });
    script.addEventListener('error', fail);
    if (!existing) {
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return razorpayLoading;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function openRazorpay(checkout: PaymentCheckout, opts: OpenCheckoutOptions): Promise<GatewayResponse> {
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
      // Core names it the way Razorpay's server API does; checkout.js reads `key`.
      key: base.key ?? base.key_id,
      ...(opts.name !== undefined ? { name: opts.name } : {}),
      ...(opts.description !== undefined ? { description: opts.description } : {}),
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
        // Closed so the promise and the modal agree: a retry inside a modal nobody is listening to
        // would take the money with no handler left to confirm it.
        instance.close();
        reject(new CheckoutFailedError(response.error?.code, response.error?.description, response.error?.reason));
      });
    });

    instance.open();
  });
}

/**
 * Opens the gateway's checkout for an intent and resolves with what core needs to confirm it.
 *
 * Rejects with `CheckoutDismissedError` when the party closes it, `CheckoutFailedError` when the
 * gateway declines, and a plain `CheckoutError` for a gateway this SDK cannot open or a script that
 * would not load.
 *
 * Resolving is not "paid": pass the result to `confirmPayment` (or `confirmPaymentAction`) and read
 * the status core answers.
 */
export function openCheckout(checkout: PaymentCheckout, opts: OpenCheckoutOptions = {}): Promise<GatewayResponse> {
  switch (checkout.gateway.toLowerCase()) {
    // Bank editions of Razorpay (HDFC's smart gateway) are Razorpay underneath — same checkout.js, same options and
    // the same response — so they open through the same launcher
    case 'razorpay':
    case 'hdfc-razorpay':
      return openRazorpay(checkout, opts);
    default:
      return Promise.reject(new CheckoutError(`This storefront cannot open a "${checkout.gateway}" checkout yet.`));
  }
}
