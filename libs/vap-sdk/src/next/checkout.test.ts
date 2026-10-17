import { describe, expect, it } from '@jest/globals';
import { CheckoutError, embeddedCheckout, RAZORPAY_EMBEDDED_CHECKOUT_URL } from './checkout.js';

const checkout = {
  gateway: 'hdfc-razorpay',
  callbackUrl: 'https://core.example/payments/checkout/org-1/pi-1/callback',
  cancelUrl: 'https://core.example/payments/checkout/org-1/pi-1/cancel',
  options: {
    key_id: 'rzp_test_abc',
    order_id: 'order_1',
    amount: 34900,
    currency: 'INR',
    prefill: { name: 'Asha', email: 'asha@example.com', contact: '9876543210' },
    notes: { payment_intent_id: 'pi-1' },
  },
};

describe('embeddedCheckout', () => {
  it("builds the HDFC kit form with core's callback and cancel addresses", () => {
    const form = embeddedCheckout(checkout, { name: 'Desi Taakat', notes: { order: 'ORD-9' } });

    expect(form.action).toBe(RAZORPAY_EMBEDDED_CHECKOUT_URL);
    expect(form.method).toBe('POST');
    expect(form.fields).toEqual({
      key_id: 'rzp_test_abc',
      order_id: 'order_1',
      callback_url: 'https://core.example/payments/checkout/org-1/pi-1/callback',
      amount: '34900',
      currency: 'INR',
      name: 'Desi Taakat',
      cancel_url: 'https://core.example/payments/checkout/org-1/pi-1/cancel',
      'prefill[name]': 'Asha',
      'prefill[email]': 'asha@example.com',
      'prefill[contact]': '9876543210',
      'notes[payment_intent_id]': 'pi-1',
      'notes[order]': 'ORD-9',
    });
  });

  it('refuses an intent with nowhere to return to', () => {
    expect(() => embeddedCheckout({ ...checkout, callbackUrl: null, cancelUrl: null })).toThrow(CheckoutError);
  });

  it('refuses a gateway it cannot open and a checkout with no order', () => {
    expect(() => embeddedCheckout({ ...checkout, gateway: 'cashfree' })).toThrow(CheckoutError);
    expect(() => embeddedCheckout({ ...checkout, gateway: 'razorpay', options: { key_id: 'k' } })).toThrow(
      CheckoutError,
    );
  });
});
