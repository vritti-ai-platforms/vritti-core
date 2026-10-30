import type { GatewayResponse, PaymentCheckout } from '../core/domains/payments.js';

// Opening a gateway's checkout in the browser — `@vritti/vap-sdk/checkout`.
//
// Core and payments-service do the server work (the order, the split, the keys, the verification); a plugin only
// opens the payment page from the public payload core returns with the intent. A storefront registers the plugins
// of the gateways it offers:
//
//   import { openCheckout } from '@vritti/vap-sdk/checkout';
//   import { razorpay } from '@vritti/vap-sdk/razorpay';
//   import { hdfc } from '@vritti/vap-sdk/hdfc';
//   await openCheckout(session.paymentIntent.checkout, { name: 'Store' }, [razorpay(), hdfc()]);

export type { GatewayResponse, PaymentCheckout };

// ── Failures ─────────────────────────────────────────────────────────────────────────────────────

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}

export class CheckoutDismissedError extends CheckoutError {
  constructor() {
    super('The checkout was closed before payment completed.');
    this.name = 'CheckoutDismissedError';
  }
}

export class CheckoutFailedError extends CheckoutError {
  constructor(
    readonly code: string | undefined,
    readonly description: string | undefined,
    readonly reason?: string,
  ) {
    super(description ?? 'The payment did not go through.');
    this.name = 'CheckoutFailedError';
  }
}

// ── Contract ─────────────────────────────────────────────────────────────────────────────────────

export type OpenCheckoutOptions = {
  // Shown on the payment page
  name?: string;
  description?: string;
  image?: string;
  theme?: { color?: string };
  notes?: Record<string, string>;
  callbackUrl?: string;
  cancelUrl?: string;
};

// What opening a checkout led to
export type CheckoutOutcome =
  // The page left for the gateway's; core's callback finishes the payment and returns the shopper to the store
  | { kind: 'redirected' }
  // A payment window on this page completed; hand the response to `confirmPaymentAction`
  | { kind: 'completed'; gatewayResponse: GatewayResponse }
  // The shopper closed the payment window without paying
  | { kind: 'dismissed' };

// One gateway's way of opening its payment page
export interface CheckoutPlugin {
  // The `checkout.gateway` codes this plugin opens
  readonly gateways: readonly string[];
  open(checkout: PaymentCheckout, options: OpenCheckoutOptions): Promise<CheckoutOutcome>;
}

// Opens the checkout of an intent through the plugin that handles its gateway
export function openCheckout(
  checkout: PaymentCheckout,
  options: OpenCheckoutOptions,
  plugins: readonly CheckoutPlugin[],
): Promise<CheckoutOutcome> {
  const gateway = checkout.gateway.toLowerCase();
  const plugin = plugins.find((candidate) => candidate.gateways.includes(gateway));
  if (!plugin) {
    return Promise.reject(new CheckoutError(`This store cannot open a "${checkout.gateway}" checkout yet.`));
  }
  return plugin.open(checkout, options);
}
