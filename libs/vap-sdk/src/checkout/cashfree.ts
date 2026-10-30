import { CheckoutError, type CheckoutPlugin, type PaymentCheckout } from './index.js';
import { asText, loadScript, requireBrowser } from './shared.js';

// Cashfree Payments — `@vritti/vap-sdk/cashfree`.
//
// Opens Cashfree's checkout for the payment session core created with the order. Cashfree takes the shopper to its
// page and back to the store's return page; the payment itself is completed by Cashfree's signed webhook to core,
// so the browser never reports a result.

export const CASHFREE_SCRIPT_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

export type CashfreeMode = 'sandbox' | 'production';

export type CashfreeSession = { paymentSessionId: string; orderId: string; mode: CashfreeMode };

type CashfreeInstance = { checkout(options: { paymentSessionId: string; redirectTarget: '_self' }): Promise<unknown> };
type CashfreeFactory = (options: { mode: CashfreeMode }) => CashfreeInstance;

// What core's payload carries for a Cashfree checkout
export function cashfreeSession(checkout: PaymentCheckout): CashfreeSession {
  if (checkout.gateway.toLowerCase() !== 'cashfree') {
    throw new CheckoutError(`This storefront cannot open a "${checkout.gateway}" Cashfree checkout.`);
  }
  const paymentSessionId = asText(checkout.options.payment_session_id);
  const orderId = asText(checkout.options.order_id);
  if (!paymentSessionId || !orderId) {
    throw new CheckoutError('This payment has no gateway order to pay, so its checkout cannot be opened.');
  }
  const mode: CashfreeMode = checkout.options.mode === 'production' ? 'production' : 'sandbox';
  return { paymentSessionId, orderId, mode };
}

// The Cashfree plugin
export function cashfree(): CheckoutPlugin {
  return {
    gateways: ['cashfree'],
    async open(checkout) {
      const session = cashfreeSession(checkout);
      requireBrowser('Opening the Cashfree checkout');
      try {
        await loadScript(CASHFREE_SCRIPT_URL);
      } catch (error) {
        throw new CheckoutError((error as Error).message);
      }
      const factory = Reflect.get(window, 'Cashfree') as CashfreeFactory | undefined;
      if (typeof factory !== 'function') {
        throw new CheckoutError('The payment window could not be loaded. Check your connection and try again.');
      }
      // Resolves only if the page could not be left; normally the browser is already on its way to Cashfree
      await factory({ mode: session.mode }).checkout({
        paymentSessionId: session.paymentSessionId,
        redirectTarget: '_self',
      });
      return { kind: 'redirected' };
    },
  };
}
