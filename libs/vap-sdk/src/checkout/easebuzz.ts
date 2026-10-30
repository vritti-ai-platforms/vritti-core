import { CheckoutError, type CheckoutPlugin, type PaymentCheckout } from './index.js';
import { asText, requireBrowser } from './shared.js';

// Easebuzz — `@vritti/vap-sdk/easebuzz`.
//
// Core opens the payment with Easebuzz server-side and hands back the hosted page to pay on. The plugin only sends the
// browser there. Easebuzz posts the result to core's hosted checkout callback, which reads the payment back from
// Easebuzz and returns the shopper to the store, so the browser never reports a result.

export type EasebuzzEnvironment = 'test' | 'production';

export type EasebuzzSession = { url: string; txnid: string; environment: EasebuzzEnvironment };

// The only hosts an Easebuzz payment page is served from
const EASEBUZZ_PAY_HOSTS: ReadonlySet<string> = new Set(['pay.easebuzz.in', 'testpay.easebuzz.in']);

// What core's payload carries for an Easebuzz checkout. The page must be Easebuzz's own, over https, so a payload that
// was tampered with can never send the shopper somewhere else
export function easebuzzSession(checkout: PaymentCheckout): EasebuzzSession {
  if (checkout.gateway.toLowerCase() !== 'easebuzz') {
    throw new CheckoutError(`This storefront cannot open a "${checkout.gateway}" Easebuzz checkout.`);
  }
  const url = asText(checkout.options.url);
  const txnid = asText(checkout.options.txnid);
  if (!url || !txnid) {
    throw new CheckoutError('This payment has no gateway order to pay, so its checkout cannot be opened.');
  }
  let page: URL;
  try {
    page = new URL(url);
  } catch {
    throw new CheckoutError('This payment’s checkout address is not valid, so it cannot be opened.');
  }
  if (page.protocol !== 'https:' || !EASEBUZZ_PAY_HOSTS.has(page.hostname)) {
    throw new CheckoutError('This payment’s checkout is not on Easebuzz, so it was not opened.');
  }
  const environment: EasebuzzEnvironment = checkout.options.environment === 'production' ? 'production' : 'test';
  return { url: page.toString(), txnid, environment };
}

// The Easebuzz plugin
export function easebuzz(): CheckoutPlugin {
  return {
    gateways: ['easebuzz'],
    async open(checkout) {
      const session = easebuzzSession(checkout);
      requireBrowser('Opening the Easebuzz checkout');
      window.location.assign(session.url);
      return { kind: 'redirected' };
    },
  };
}
