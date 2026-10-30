import {
  CheckoutError,
  type GatewayResponse,
  type OpenCheckoutOptions,
  type PaymentCheckout,
} from '@vritti/vap-sdk/checkout';
import { openRazorpayModal } from '@vritti/vap-sdk/razorpay';

// Opening a gateway's checkout in the browser — `/vap-sdk/next/checkout`.
//
// @deprecated Use the gateway plugins instead: `openCheckout` from `@vritti/vap-sdk/checkout` with `razorpay()` from
// `@vritti/vap-sdk/razorpay` and `hdfc()` from `@vritti/vap-sdk/hdfc`. Kept for one release so existing storefronts
// keep working; everything here forwards to the plugins.

export type { GatewayResponse, OpenCheckoutOptions, PaymentCheckout };
export { CheckoutDismissedError, CheckoutError, CheckoutFailedError } from '@vritti/vap-sdk/checkout';
export {
  type EmbeddedCheckoutForm,
  type EmbeddedCheckoutOptions,
  embeddedCheckout,
  RAZORPAY_EMBEDDED_CHECKOUT_URL,
  submitEmbeddedCheckout,
} from '@vritti/vap-sdk/razorpay';

// @deprecated Opens checkout.js for an intent and resolves with what core needs to confirm it. Use `openCheckout`
// from `@vritti/vap-sdk/checkout` with `razorpay({ mode: 'modal' })`.
export function openCheckout(checkout: PaymentCheckout, opts: OpenCheckoutOptions = {}): Promise<GatewayResponse> {
  switch (checkout.gateway.toLowerCase()) {
    case 'razorpay':
    case 'hdfc-razorpay':
      return openRazorpayModal(checkout, opts);
    default:
      return Promise.reject(new CheckoutError(`This storefront cannot open a "${checkout.gateway}" checkout yet.`));
  }
}
