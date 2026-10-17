import { describe, expect, it } from '@jest/globals';
import { checkoutAttemptUrl, checkoutRetryUrl, readCheckoutAttempt, readCheckoutRetry } from './checkout-urls.js';

const INTENT = '0199aa00-0000-7000-8000-000000000001';
const KEY = '0199aa00-0000-7000-8000-0000000000ff';

describe('checkout URLs', () => {
  it('reads back the attempt core appends to the return URL', () => {
    const url = checkoutAttemptUrl('https://shop.example/checkout/return', {
      paymentIntentId: INTENT,
      orderNumber: 'SO-1',
    });

    expect(url).toBe(`https://shop.example/checkout/return?intent=${INTENT}&order=SO-1`);
    expect(readCheckoutAttempt(new URL(url).searchParams)).toEqual({ paymentIntentId: INTENT, orderNumber: 'SO-1' });
  });

  it('keeps the retry key when core appends a decline to the checkout URL', () => {
    const url = `${checkoutRetryUrl('https://shop.example/checkout', { idempotencyKey: KEY })}&payment=failed&message=Card+declined`;

    expect(readCheckoutRetry(new URL(url).searchParams)).toEqual({
      idempotencyKey: KEY,
      outcome: 'failed',
      message: 'Card declined',
    });
  });

  it('drops values that are not the shape they should be', () => {
    expect(readCheckoutAttempt({ intent: 'nope' })).toBeNull();
    expect(readCheckoutAttempt({ intent: INTENT, order: '<b>rude</b>', key: 'a b' })).toEqual({
      paymentIntentId: INTENT,
    });
  });

  it('round-trips a retry and ignores an unknown outcome', () => {
    const url = checkoutRetryUrl('/checkout', { idempotencyKey: KEY, outcome: 'cancelled' });
    expect(url).toBe(`/checkout?retry=${KEY}&payment=cancelled`);
    expect(readCheckoutRetry(new URL(url, 'https://shop.example').searchParams)).toEqual({
      idempotencyKey: KEY,
      outcome: 'cancelled',
    });
    expect(readCheckoutRetry({ payment: 'hacked' })).toEqual({});
  });

  it('appends to a base that already has a query', () => {
    expect(checkoutAttemptUrl('/done?x=1', { paymentIntentId: INTENT })).toBe(`/done?x=1&intent=${INTENT}`);
  });
});
