/**
 * Checkout and payment actions. See `cart.ts` for why this barrel carries no directive.
 *
 * Server only. The browser half — the embedded page and the modal — is `@vritti/vap-sdk/next/checkout`.
 * The embedded page's way back is core's: Razorpay posts to core, which confirms and redirects the party
 * to the return or checkout URL `startCheckoutAction` handed over.
 */

export type {
  CancelPaymentActionState,
  CheckoutActionState,
  ConfirmPaymentActionState,
  PaymentIntentActionState,
} from './payments-actions.js';
export {
  cancelPaymentAction,
  confirmPaymentAction,
  getPaymentIntentAction,
  startCheckoutAction,
} from './payments-actions.js';
export type { PartyActionState } from './state.js';
