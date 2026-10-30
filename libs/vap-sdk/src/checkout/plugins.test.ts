import { describe, expect, it } from '@jest/globals';
import { cashfree, cashfreeSession } from './cashfree.js';
import { hdfc, hdfcCheckoutForm } from './hdfc.js';
import { CheckoutError, type CheckoutPlugin, openCheckout, type PaymentCheckout } from './index.js';
import { embeddedCheckout, RAZORPAY_EMBEDDED_CHECKOUT_URL, razorpay } from './razorpay.js';

const checkout = (gateway: string): PaymentCheckout => ({
  gateway,
  callbackUrl: 'https://core.example/payments/checkout/org-1/pi-1/callback',
  cancelUrl: 'https://core.example/payments/checkout/org-1/pi-1/cancel',
  options: {
    key_id: 'rzp_test_abc',
    order_id: 'order_1',
    amount: 34900,
    currency: 'INR',
    prefill: { name: 'Asha', contact: '9999999999' },
    notes: { order: 'ORD-1' },
  },
});

describe('openCheckout', () => {
  it('opens through the plugin that handles the gateway, whatever the case', async () => {
    const opened: string[] = [];
    const fake = (code: string): CheckoutPlugin => ({
      gateways: [code],
      async open(c) {
        opened.push(c.gateway);
        return { kind: 'redirected' };
      },
    });

    await expect(
      openCheckout(checkout('HDFC-Razorpay'), {}, [fake('razorpay'), fake('hdfc-razorpay')]),
    ).resolves.toEqual({
      kind: 'redirected',
    });
    expect(opened).toEqual(['HDFC-Razorpay']);
  });

  it('refuses a gateway no registered plugin handles', async () => {
    await expect(openCheckout(checkout('cashfree'), {}, [razorpay(), hdfc()])).rejects.toBeInstanceOf(CheckoutError);
  });

  it('keeps each gateway on its own plugin', () => {
    expect(razorpay().gateways).toEqual(['razorpay']);
    expect(hdfc().gateways).toEqual(['hdfc-razorpay']);
  });
});

describe('Razorpay embedded form', () => {
  it("posts the public options to Razorpay's hosted page with core's callback", () => {
    const form = embeddedCheckout(checkout('razorpay'), { name: 'Desi Taakat', notes: { channel: 'web' } });

    expect(form.action).toBe(RAZORPAY_EMBEDDED_CHECKOUT_URL);
    expect(form.method).toBe('POST');
    expect(form.fields).toEqual({
      key_id: 'rzp_test_abc',
      order_id: 'order_1',
      callback_url: 'https://core.example/payments/checkout/org-1/pi-1/callback',
      cancel_url: 'https://core.example/payments/checkout/org-1/pi-1/cancel',
      amount: '34900',
      currency: 'INR',
      name: 'Desi Taakat',
      'prefill[name]': 'Asha',
      'prefill[contact]': '9999999999',
      'notes[order]': 'ORD-1',
      'notes[channel]': 'web',
    });
  });

  it('refuses a payment with no gateway order or nowhere to return to', () => {
    expect(() => embeddedCheckout({ ...checkout('razorpay'), options: {} })).toThrow(CheckoutError);
    expect(() => embeddedCheckout({ ...checkout('razorpay'), callbackUrl: null })).toThrow(CheckoutError);
  });
});

describe('HDFC SmartGateway form', () => {
  it("builds the same hosted form from HDFC's own copy", () => {
    const form = hdfcCheckoutForm(checkout('hdfc-razorpay'));

    expect(form.fields).toMatchObject({ key_id: 'rzp_test_abc', order_id: 'order_1', amount: '34900' });
    expect(form.fields.callback_url).toBe('https://core.example/payments/checkout/org-1/pi-1/callback');
  });

  it('refuses a payment with no gateway order', () => {
    expect(() => hdfcCheckoutForm({ ...checkout('hdfc-razorpay'), options: {} })).toThrow(CheckoutError);
  });
});

describe('Cashfree session', () => {
  const checkout: PaymentCheckout = {
    gateway: 'cashfree',
    options: { order_id: 'vp_1', payment_session_id: 'session_1', mode: 'production' },
    callbackUrl: null,
    cancelUrl: null,
  };

  it('reads the payment session and mode core sent, defaulting to sandbox', () => {
    expect(cashfree().gateways).toEqual(['cashfree']);
    expect(cashfreeSession(checkout)).toEqual({ paymentSessionId: 'session_1', orderId: 'vp_1', mode: 'production' });
    expect(cashfreeSession({ ...checkout, options: { order_id: 'vp_1', payment_session_id: 's' } }).mode).toBe(
      'sandbox',
    );
  });

  it('refuses another gateway and a checkout with no session', () => {
    expect(() => cashfreeSession({ ...checkout, gateway: 'razorpay' })).toThrow(CheckoutError);
    expect(() => cashfreeSession({ ...checkout, options: { order_id: 'vp_1' } })).toThrow(CheckoutError);
  });
});
