import type { GatewayResponse, PaymentCheckout } from '@vritti/vap-sdk';

/**
 * Opening a gateway's checkout in the browser — `@vritti/vap-sdk/next/checkout`.
 *
 * **Client-safe.** No `'use server'`, no `next/headers`, no Payload: import it from a client component.
 * The server half — starting the checkout, confirming it — is `@vritti/vap-sdk/next/payments`.
 *
 * Two ways to take the payment:
 *
 * - **Embedded page** (HDFC's Razorpay kit): `submitEmbeddedCheckout(embeddedCheckout(checkout))`
 *   leaves for the gateway's page. Razorpay posts the result to **core**, which confirms it and
 *   redirects the party to the return or checkout URL `startCheckoutAction` handed over.
 * - **Modal**: `openCheckout(checkout)` opens checkout.js over the page and resolves with what
 *   `confirmPaymentAction` needs.
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

// ── Failures ─────────────────────────────────────────────────────────────────────────────────────

/** Base of every failure `openCheckout` reports, so one `instanceof` catches them all. */
export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}

/**
 * The party closed the modal without paying.
 *
 * Not a failure: nothing was charged and the intent is still open, so opening the same checkout again
 * retries on the same gateway order.
 */
export class CheckoutDismissedError extends CheckoutError {
  constructor() {
    super('The checkout was closed before payment completed.');
    this.name = 'CheckoutDismissedError';
  }
}

/**
 * The gateway declined the attempt — card refused, UPI timed out.
 *
 * The modal is closed when this is raised, so the promise settles once. The intent stays open: open
 * the same checkout again to let them retry.
 */
export class CheckoutFailedError extends CheckoutError {
  constructor(
    /** The gateway's error code, e.g. `BAD_REQUEST_ERROR`. */
    readonly code: string | undefined,
    /** The gateway's sentence for it, written for the payer. */
    readonly description: string | undefined,
    /** The gateway's machine-readable reason, e.g. `payment_failed`. */
    readonly reason?: string,
  ) {
    super(description ?? 'The payment did not go through.');
    this.name = 'CheckoutFailedError';
  }
}

// ── Embedded page ───────────────────────────────────────────────────────────────────────────────

/** Where the embedded checkout form is posted. HDFC-issued keys use the same host — the kit names no other. */
export const RAZORPAY_EMBEDDED_CHECKOUT_URL = 'https://api.razorpay.com/v1/checkout/embedded';

// Bank editions of Razorpay (HDFC's smart gateway) are Razorpay underneath and take the same form
const RAZORPAY_GATEWAYS = new Set(['razorpay', 'hdfc-razorpay']);

export type EmbeddedCheckoutOptions = {
  /** Where Razorpay posts the result. Defaults to core's `checkout.callbackUrl` — override only to test. */
  callbackUrl?: string;
  /** Where Razorpay sends a party who cancels. Defaults to core's `checkout.cancelUrl`. */
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
 * Built from `intent.checkout` — the key id, the gateway order, the amount in paise, the currency, the
 * prefill, and core's callback and cancel addresses — plus what only the storefront knows: what to call
 * itself. Nested values are flattened the way Razorpay's form API reads them — `prefill[email]`,
 * `notes[reference]`.
 *
 * Throws when there is nowhere for the result to go: an intent opened without a return or checkout URL
 * has no callback, and the embedded page needs one (the modal does not — use `openCheckout`).
 */
export function embeddedCheckout(checkout: PaymentCheckout, opts: EmbeddedCheckoutOptions = {}): EmbeddedCheckoutForm {
  requireRazorpay(checkout.gateway);
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

  const fields: Record<string, string> = {
    key_id: keyId,
    order_id: orderId,
    callback_url: callbackUrl,
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
  put('cancel_url', opts.cancelUrl ?? checkout.cancelUrl);
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

// ── Modal ───────────────────────────────────────────────────────────────────────────────────────

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
