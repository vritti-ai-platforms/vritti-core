import type { ApolloClient } from '@apollo/client';
import { describe, expect, it, jest } from '@jest/globals';
import { VapError } from '../errors.js';
import { createCheckoutOperations } from './checkout.js';
import { createPaymentsOperations, parseCheckout, toKeyValues } from './payments.js';

// An intent as core answers it — `__typename`s included, the way Apollo hands them back.
function rawIntent(payload = JSON.stringify({ key_id: 'rzp_test', order_id: 'order_1', amount: 49900 })) {
  return {
    __typename: 'PaymentIntent',
    id: 'pi_1',
    status: 'CREATED',
    amount: { __typename: 'Money', currency: 'INR', value: '499.00' },
    reference: { __typename: 'PaymentReference', type: 'booking', id: 'b_1' },
    description: null,
    checkout: { __typename: 'PaymentCheckout', gateway: 'razorpay', payload },
    failure: null,
    paidAt: null,
    expiresAt: '2026-10-09T10:30:00.000Z',
    createdAt: '2026-10-09T10:00:00.000Z',
  };
}

type Call = { variables?: unknown; context?: { requestContext?: unknown } };

function fakeClient(data: Record<string, unknown>) {
  const mutate = jest.fn(async (_options: Call) => ({ data }));
  const query = jest.fn(async (_options: Call) => ({ data }));
  return { client: { mutate, query } as unknown as ApolloClient, mutate, query };
}

describe('payments', () => {
  it('maps money and metadata into core’s input shape, at the site', async () => {
    const { client, mutate } = fakeClient({ createPaymentIntent: rawIntent() });
    const payments = createPaymentsOperations(client, { siteId: 'site_1', legalEntityId: 'le_1', partyId: 'p_1' });

    const amount = { currency: 'INR', value: '499.00', __typename: 'Money' } as { currency: string; value: string };
    await payments.createPaymentIntent({
      amount,
      reference: { type: 'booking', id: 'b_1' },
      idempotencyKey: 'booking-b_1',
      metadata: { slot: 'morning', seats: '2' },
    });

    const call = mutate.mock.calls[0]?.[0];
    expect(call?.variables).toEqual({
      input: {
        amount: { currency: 'INR', value: '499.00' },
        reference: { type: 'booking', id: 'b_1' },
        description: undefined,
        customer: undefined,
        idempotencyKey: 'booking-b_1',
        metadata: [
          { key: 'slot', value: 'morning' },
          { key: 'seats', value: '2' },
        ],
        channel: undefined,
      },
    });
    // Site-scoped: the site header only, never the LE alongside it.
    // Site-scoped: the site header only, never the LE alongside it. The party travels when bound.
    expect(call?.context?.requestContext).toEqual({ partyId: 'p_1', siteId: 'site_1' });
  });

  it('sends no metadata at all for an empty map', () => {
    expect(toKeyValues({})).toBeUndefined();
    expect(toKeyValues(undefined)).toBeUndefined();
  });

  it('parses the checkout payload and drops __typename', async () => {
    const { client } = fakeClient({ paymentIntent: rawIntent() });
    const intent = await createPaymentsOperations(client, { siteId: 'site_1' }).paymentIntent('pi_1');

    expect(intent.checkout).toEqual({
      gateway: 'razorpay',
      options: { key_id: 'rzp_test', order_id: 'order_1', amount: 49900 },
      callbackUrl: null,
      cancelUrl: null,
    });
    expect(intent.amount).toEqual({ currency: 'INR', value: '499.00' });
    expect(intent.reference).toEqual({ type: 'booking', id: 'b_1' });
  });

  it("makes core's callback and cancel paths absolute on the endpoint's origin", () => {
    const checkout = parseCheckout(
      {
        gateway: 'razorpay',
        payload: '{"key_id":"rzp_test"}',
        callbackPath: '/payments/checkout/org-1/pi-1/callback',
        cancelPath: '/payments/checkout/org-1/pi-1/cancel',
      },
      'https://core.example',
    );

    expect(checkout?.callbackUrl).toBe('https://core.example/payments/checkout/org-1/pi-1/callback');
    expect(checkout?.cancelUrl).toBe('https://core.example/payments/checkout/org-1/pi-1/cancel');
  });

  it('rejects with VapError on a checkout payload that is not a JSON object', async () => {
    const { client } = fakeClient({ paymentIntent: rawIntent('{not json') });
    await expect(createPaymentsOperations(client, { siteId: 'site_1' }).paymentIntent('pi_1')).rejects.toBeInstanceOf(
      VapError,
    );
    expect(() => parseCheckout({ gateway: 'razorpay', payload: '[1,2]' })).toThrow(VapError);
    expect(parseCheckout(null)).toBeNull();
  });

  it('refuses, as a rejected promise, without a site', async () => {
    const { client, query } = fakeClient({ paymentIntent: rawIntent() });
    await expect(
      createPaymentsOperations(client, { legalEntityId: 'le_1' }).paymentIntent('pi_1'),
    ).rejects.toMatchObject({
      code: 'Not Configured',
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('sends only the three gateway fields on confirm', async () => {
    const { client, mutate } = fakeClient({ confirmPayment: { ...rawIntent(), status: 'SUCCEEDED', checkout: null } });
    const gatewayResponse = { orderId: 'o', paymentId: 'p', signature: 's', extra: 'x' };
    const intent = await createPaymentsOperations(client, { siteId: 'site_1' }).confirmPayment({
      paymentIntentId: 'pi_1',
      gatewayResponse,
    });

    expect(mutate.mock.calls[0]?.[0].variables).toEqual({
      input: { paymentIntentId: 'pi_1', gatewayResponse: { orderId: 'o', paymentId: 'p', signature: 's' } },
    });
    expect(intent.status).toBe('SUCCEEDED');
    expect(intent.checkout).toBeNull();
  });
});

describe('checkout.startFromCart', () => {
  const session = {
    startCheckoutFromCart: {
      order: {
        __typename: 'CheckoutOrder',
        id: 'o_1',
        orderNumber: 'SO-1',
        total: { currency: 'INR', value: '499.00' },
      },
      paymentIntent: rawIntent(),
    },
  };

  it('needs a party', async () => {
    const { client } = fakeClient(session);
    await expect(
      createCheckoutOperations(client, { siteId: 'site_1' }, 'INR').startFromCart({ idempotencyKey: 'k' }),
    ).rejects.toMatchObject({
      code: 'No Party',
    });
  });

  it("checks out without a configured currency, leaving core to use the site's", async () => {
    const { client, mutate } = fakeClient(session);
    const result = await createCheckoutOperations(client, { siteId: 'site_1', partyId: 'p_1' }).startFromCart({
      idempotencyKey: 'k',
    });

    expect(mutate.mock.calls[0]?.[0].variables).toEqual({
      input: { addressId: undefined, notes: undefined, idempotencyKey: 'k' },
    });
    expect(result.order.orderNumber).toBe('SO-1');
  });

  it('checks out in the configured currency and parses the intent', async () => {
    const { client, mutate } = fakeClient(session);
    const result = await createCheckoutOperations(client, { siteId: 'site_1', partyId: 'p_1' }, 'INR').startFromCart({
      addressId: 'addr_1',
      idempotencyKey: 'k',
    });

    expect(mutate.mock.calls[0]?.[0].variables).toEqual({
      input: { currencyCode: 'INR', addressId: 'addr_1', notes: undefined, idempotencyKey: 'k' },
    });
    expect(result.order).toEqual({ id: 'o_1', orderNumber: 'SO-1', total: { currency: 'INR', value: '499.00' } });
    expect(result.paymentIntent.checkout?.options.order_id).toBe('order_1');
  });
});
