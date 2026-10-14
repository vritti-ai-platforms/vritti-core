import { createHash, createHmac } from 'node:crypto';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { RazorpayHttpService } from '@/gateways/razorpay/services/razorpay-http.service';
import { RazorpayTransport } from './razorpay.transport';

const SECRET = 'whsec_test';
const CREDENTIALS = { key_id: 'rzp_test_abc', key_secret: 'key-secret' };

const sign = (body: string, secret = SECRET) => createHmac('sha256', secret).update(body).digest('hex');
const sha256 = (body: string) => createHash('sha256').update(body).digest('hex');

describe('RazorpayTransport', () => {
  const transport = new RazorpayTransport({} as RazorpayHttpService);

  describe('verifyWebhook', () => {
    const body = JSON.stringify({ event: 'payment.captured' });

    it('accepts a body signed with the webhook secret, whatever the header case', () => {
      expect(transport.verifyWebhook(SECRET, body, { 'X-Razorpay-Signature': sign(body) })).toBe(true);
    });

    it('rejects a body signed with another secret', () => {
      expect(transport.verifyWebhook(SECRET, body, { 'x-razorpay-signature': sign(body, 'other') })).toBe(false);
    });

    it('rejects a tampered body', () => {
      expect(transport.verifyWebhook(SECRET, `${body} `, { 'x-razorpay-signature': sign(body) })).toBe(false);
    });

    it('rejects a delivery without a signature header', () => {
      expect(transport.verifyWebhook(SECRET, body, {})).toBe(false);
    });
  });

  describe('parseWebhook', () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: { entity: { id: 'pay_1', order_id: 'order_1', status: 'captured', amount: 50000, currency: 'INR' } },
      },
    });

    it('dedupes on the signed body, never on the unsigned event id header', () => {
      const first = transport.parseWebhook(body, { 'x-razorpay-event-id': 'evt_1' })[0];
      const replay = transport.parseWebhook(body, { 'x-razorpay-event-id': 'evt_forged' })[0];

      expect(first.dedupeKey).toBe(sha256(body));
      expect(replay.dedupeKey).toBe(first.dedupeKey);
      expect(first.providerEventId).toBe('evt_1');
    });

    it('normalizes the payment and its order, with amounts as bigint', () => {
      const [event] = transport.parseWebhook(body, {});

      expect(event.eventType).toBe('payment.captured');
      expect(event.providerOrderId).toBe('order_1');
      expect(event.payment).toMatchObject({ providerPaymentId: 'pay_1', status: 'captured', amount: 50000n });
      expect(event.transfer).toBeNull();
    });

    it('normalizes a transfer event', () => {
      const transferBody = JSON.stringify({
        event: 'transfer.processed',
        payload: {
          transfer: {
            entity: { id: 'trf_1', status: 'processed', source: 'pay_1', recipient: 'acc_1', amount: 70000 },
          },
        },
      });

      const [event] = transport.parseWebhook(transferBody, {});

      expect(event.transfer).toMatchObject({
        providerTransferId: 'trf_1',
        providerAccountId: 'acc_1',
        providerPaymentId: 'pay_1',
        amount: 70000n,
        status: 'PROCESSED',
      });
    });

    it('refuses a body with no event name', () => {
      expect(() => transport.parseWebhook('{}', {})).toThrow(BadRequestException);
    });
  });

  describe('verifyCheckoutSignature', () => {
    it('accepts HMAC(order_id|payment_id) keyed with the key secret', () => {
      const signature = createHmac('sha256', CREDENTIALS.key_secret).update('order_1|pay_1').digest('hex');
      expect(
        transport.verifyCheckoutSignature(CREDENTIALS, {
          providerOrderId: 'order_1',
          providerPaymentId: 'pay_1',
          signature,
        }),
      ).toBe(true);
    });

    it('rejects a signature over another payment', () => {
      const signature = createHmac('sha256', CREDENTIALS.key_secret).update('order_1|pay_2').digest('hex');
      expect(
        transport.verifyCheckoutSignature(CREDENTIALS, {
          providerOrderId: 'order_1',
          providerPaymentId: 'pay_1',
          signature,
        }),
      ).toBe(false);
    });
  });
});
