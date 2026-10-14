import { describe, expect, it } from '@jest/globals';
import { embeddedCheckout, parseCheckoutCallback, RAZORPAY_EMBEDDED_CHECKOUT_URL } from './embedded';
import { CheckoutError } from './errors';

const checkout = {
  gateway: 'hdfc-razorpay',
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
  it('builds the HDFC kit form: key, order, amount, flattened prefill and notes, callback', () => {
    const form = embeddedCheckout(checkout, {
      callbackUrl: 'https://shop.example/checkout/callback?intent=pi-1',
      cancelUrl: 'https://shop.example/checkout?payment=cancelled',
      name: 'Desi Taakat',
      notes: { order: 'ORD-9' },
    });

    expect(form.action).toBe(RAZORPAY_EMBEDDED_CHECKOUT_URL);
    expect(form.method).toBe('POST');
    expect(form.fields).toEqual({
      key_id: 'rzp_test_abc',
      order_id: 'order_1',
      callback_url: 'https://shop.example/checkout/callback?intent=pi-1',
      amount: '34900',
      currency: 'INR',
      name: 'Desi Taakat',
      cancel_url: 'https://shop.example/checkout?payment=cancelled',
      'prefill[name]': 'Asha',
      'prefill[email]': 'asha@example.com',
      'prefill[contact]': '9876543210',
      'notes[payment_intent_id]': 'pi-1',
      'notes[order]': 'ORD-9',
    });
  });

  it('refuses a gateway it cannot open and a checkout with no order', () => {
    expect(() => embeddedCheckout({ ...checkout, gateway: 'cashfree' }, { callbackUrl: 'x' })).toThrow(CheckoutError);
    expect(() => embeddedCheckout({ gateway: 'razorpay', options: { key_id: 'k' } }, { callbackUrl: 'x' })).toThrow(
      CheckoutError,
    );
  });
});

describe('parseCheckoutCallback', () => {
  it('reads a successful payment', () => {
    const body = new URLSearchParams({
      razorpay_payment_id: 'pay_1',
      razorpay_order_id: 'order_1',
      razorpay_signature: 'sig',
    });

    expect(parseCheckoutCallback('hdfc-razorpay', body)).toEqual({
      ok: true,
      gatewayResponse: { orderId: 'order_1', paymentId: 'pay_1', signature: 'sig' },
    });
  });

  it('reads a failure with its metadata ids', () => {
    const body = new URLSearchParams({
      'error[code]': 'BAD_REQUEST_ERROR',
      'error[description]': 'Payment failed',
      'error[reason]': 'payment_failed',
      'error[metadata]': JSON.stringify({ payment_id: 'pay_2', order_id: 'order_1' }),
    });

    expect(parseCheckoutCallback('razorpay', body)).toEqual({
      ok: false,
      error: { code: 'BAD_REQUEST_ERROR', description: 'Payment failed', reason: 'payment_failed' },
      providerOrderId: 'order_1',
      providerPaymentId: 'pay_2',
    });
  });

  it('treats a body with no payment as a failure rather than trusting partial ids', () => {
    const result = parseCheckoutCallback('razorpay', { razorpay_order_id: 'order_1' });
    expect(result.ok).toBe(false);
  });
});
