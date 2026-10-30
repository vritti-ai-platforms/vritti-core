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
      gatewayCode: 'razorpay',
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
        checkoutUrl: undefined,
        returnUrl: undefined,
        gatewayCode: 'razorpay',
      },
    });
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

describe('checkout.start', () => {
  // A checkout as core answers it the moment the payment opens: no orders yet, the intent bound
  const rawCheckout = {
    __typename: 'Checkout',
    id: 'chk_1',
    status: 'OPEN',
    currencyCode: 'INR',
    total: { __typename: 'Money', currency: 'INR', value: '499.00' },
    sites: [
      {
        __typename: 'CheckoutStoreShare',
        siteId: 'site_1',
        legalEntityId: 'le_1',
        subtotal: { __typename: 'Money', currency: 'INR', value: '300.00' },
      },
      {
        __typename: 'CheckoutStoreShare',
        siteId: 'site_2',
        legalEntityId: 'le_2',
        subtotal: { __typename: 'Money', currency: 'INR', value: '199.00' },
      },
    ],
    orders: [],
    paymentIntent: rawIntent(),
  };
  const started = { startCheckout: rawCheckout };
  const context = { siteId: 'site_1', legalEntityId: 'le_1', partyId: 'p_1' };

  it('checks every store out at the organization, in the configured currency, and parses the checkout', async () => {
    const { client, mutate } = fakeClient(started);
    const result = await createCheckoutOperations(client, context, 'INR').start({
      idempotencyKey: 'k',
      gatewayCode: 'cashfree',
      addressId: 'addr_1',
    });

    const call = mutate.mock.calls[0]?.[0];
    expect(call?.variables).toEqual({
      input: {
        currencyCode: 'INR',
        siteId: undefined,
        gatewayCode: 'cashfree',
        addressId: 'addr_1',
        notes: undefined,
        idempotencyKey: 'k',
        returnUrl: undefined,
        checkoutUrl: undefined,
      },
    });
    // Under the visitor's store, where the permission check resolves — core reads every store's cart regardless
    expect(call?.context?.requestContext).toEqual({ partyId: 'p_1', siteId: 'site_1' });

    expect(result.id).toBe('chk_1');
    expect(result.status).toBe('OPEN');
    expect(result.sites.map((share) => share.subtotal.value)).toEqual(['300.00', '199.00']);
    expect(result.orders).toEqual([]);
    expect(result.paymentIntent?.checkout?.options.order_id).toBe('order_1');
  });

  it('refuses without a pick when the cart offers several gateways, or none', async () => {
    const several = fakeClient({ ...started, cart: { checkout: { gateways: ['razorpay', 'cashfree'] } } });
    await expect(
      createCheckoutOperations(several.client, context, 'INR').start({ idempotencyKey: 'k' }),
    ).rejects.toMatchObject({
      code: 'Payment Gateway Required',
    });
    const none = fakeClient({ ...started, cart: { checkout: { gateways: [] } } });
    await expect(
      createCheckoutOperations(none.client, context, 'INR').start({ idempotencyKey: 'k' }),
    ).rejects.toMatchObject({
      code: 'Payments Not Set Up',
    });
    expect(several.mutate).not.toHaveBeenCalled();
    expect(none.mutate).not.toHaveBeenCalled();
  });

  it("uses the named store's only gateway when one store is checked out", async () => {
    const { client, mutate } = fakeClient({
      ...started,
      cart: { sites: [{ siteId: 'site_2', gateways: ['cashfree'] }], checkout: { gateways: [] } },
    });
    await createCheckoutOperations(client, context, 'INR').start({ idempotencyKey: 'k', siteId: 'site_2' });
    const input = (mutate.mock.calls[0]?.[0].variables as { input: { gatewayCode: string; siteId: string } }).input;
    expect(input).toMatchObject({ gatewayCode: 'cashfree', siteId: 'site_2' });
  });

  it("uses the cart's only checkout gateway when none was picked", async () => {
    const { client, query, mutate } = fakeClient({ ...started, cart: { checkout: { gateways: ['cashfree'] } } });
    await createCheckoutOperations(client, context, 'INR').start({ idempotencyKey: 'k' });
    expect(query).toHaveBeenCalledTimes(1);
    expect((mutate.mock.calls[0]?.[0].variables as { input: { gatewayCode: string } }).input.gatewayCode).toBe(
      'cashfree',
    );
  });

  it('refuses without a configured currency, without a party, and without a store to ask from', async () => {
    const { client, mutate } = fakeClient(started);
    await expect(
      createCheckoutOperations(client, context).start({ idempotencyKey: 'k', gatewayCode: 'cashfree' }),
    ).rejects.toMatchObject({ code: 'Not Configured' });
    await expect(
      createCheckoutOperations(client, { siteId: 'site_1' }, 'INR').start({ idempotencyKey: 'k' }),
    ).rejects.toMatchObject({ code: 'No Party' });
    await expect(
      createCheckoutOperations(client, { partyId: 'p_1' }, 'INR').start({
        idempotencyKey: 'k',
        gatewayCode: 'cashfree',
      }),
    ).rejects.toMatchObject({ code: 'Not Configured' });
    expect(mutate).not.toHaveBeenCalled();
  });

  it('reads a checkout fresh, at the organization, with the orders it became', async () => {
    const converted = {
      ...rawCheckout,
      status: 'CONVERTED',
      orders: [
        { __typename: 'CheckoutStoreOrder', siteId: 'site_1', orderId: 'o_1', orderNumber: 'SO-1' },
        { __typename: 'CheckoutStoreOrder', siteId: 'site_2', orderId: 'o_2', orderNumber: 'SO-2' },
      ],
      paymentIntent: { ...rawIntent(), status: 'SUCCEEDED' },
    };
    const { client, query } = fakeClient({ checkout: converted });
    const result = await createCheckoutOperations(client, context, 'INR').find('chk_1');

    const call = query.mock.calls[0]?.[0] as Call & { fetchPolicy?: string };
    expect(call.variables).toEqual({ input: { checkoutId: 'chk_1' } });
    expect(call.context?.requestContext).toEqual({ partyId: 'p_1', siteId: 'site_1' });
    expect(call.fetchPolicy).toBe('no-cache');
    expect(result.status).toBe('CONVERTED');
    expect(result.orders.map((order) => order.orderNumber)).toEqual(['SO-1', 'SO-2']);
    expect(result.paymentIntent?.status).toBe('SUCCEEDED');
  });
});
