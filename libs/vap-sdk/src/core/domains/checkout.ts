import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors.js';
import { CHECKOUT_PAYMENT_GATEWAYS, START_CHECKOUT_FROM_CART } from '../graphql/checkout.js';
import { requireData, run } from '../transport/errors.js';
import { contextForScope, type Money, type RequestContext } from '../types.js';
import { type PaymentIntent, toPaymentIntent } from './payments.js';

export type CheckoutOrder = { id: string; orderNumber: string; total: Money };

export type CheckoutSession = { order: CheckoutOrder; paymentIntent: PaymentIntent };

// A gateway the payment page can offer: one with a payout channel for this store, app and sales channel
export type CheckoutPaymentGateway = {
  id: string;
  gatewayCode: string;
  label: string;
  // The catalog logos from Vritti Cloud admin; null until the gateway config is saved after they were added
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
};

export type CheckoutPaymentChannel = 'APP' | 'POS' | 'B2B';

export type StartCheckoutInput = {
  // The gateway the shopper picked, one of `paymentGateways()`. Left out, the store's only gateway is used; with
  // none or several to choose from, checkout refuses and the page must ask
  paymentGatewayConfigId?: string;
  addressId?: string;
  notes?: string;
  idempotencyKey: string;
  returnUrl?: string;
  checkoutUrl?: string;
};

// Checking a basket out: order and payment intent in one call.
export function createCheckoutOperations(
  client: ApolloClient,
  context: RequestContext = {},
  currency?: string,
  coreOrigin?: string,
) {
  const requireParty = (): void => {
    if (!context.partyId) {
      throw new VapError('This needs a signed-in party — use sdk.forContext({ partyId }).', 'No Party', 401);
    }
  };

  // The gateways the payment page can offer for this store
  async function paymentGateways(channel: CheckoutPaymentChannel = 'APP'): Promise<CheckoutPaymentGateway[]> {
    const requestContext = { requestContext: contextForScope(context, 'site') };
    return run(() =>
      client
        .query({
          query: CHECKOUT_PAYMENT_GATEWAYS,
          variables: { input: { channel } },
          context: requestContext,
          fetchPolicy: 'no-cache',
        })
        .then((r) =>
          requireData(r.data).checkoutPaymentGateways.map((gateway) => ({
            id: gateway.id,
            gatewayCode: gateway.gatewayCode,
            label: gateway.label,
            logoLightUrl: gateway.logoLightUrl ?? null,
            logoDarkUrl: gateway.logoDarkUrl ?? null,
          })),
        ),
    );
  }

  // The picked gateway, or the store's only one when none was picked
  async function resolveGateway(picked: string | undefined): Promise<string> {
    if (picked) return picked;
    const available = await paymentGateways('APP');
    if (available.length === 1) return available[0].id;
    if (available.length === 0) {
      throw new VapError('Online payments are not set up for this store yet.', 'Payments Not Set Up', 400);
    }
    throw new VapError('Choose how you want to pay.', 'Payment Gateway Required', 400);
  }

  return {
    paymentGateways,

    // Turns the basket into an order and opens its payment.
    async startFromCart(input: StartCheckoutInput): Promise<CheckoutSession> {
      requireParty();
      const requestContext = { requestContext: contextForScope(context, 'site') };
      const paymentGatewayConfigId = await resolveGateway(input.paymentGatewayConfigId);
      return run(() =>
        client
          .mutate({
            mutation: START_CHECKOUT_FROM_CART,
            variables: {
              input: {
                ...(currency ? { currencyCode: currency } : {}),
                paymentGatewayConfigId,
                addressId: input.addressId,
                notes: input.notes,
                idempotencyKey: input.idempotencyKey,
                returnUrl: input.returnUrl,
                checkoutUrl: input.checkoutUrl,
              },
            },
            context: requestContext,
          })
          .then((r) => {
            const { order, paymentIntent } = requireData(r.data).startCheckoutFromCart;
            return {
              order: {
                id: order.id,
                orderNumber: order.orderNumber,
                total: { currency: order.total.currency, value: order.total.value },
              },
              paymentIntent: toPaymentIntent(paymentIntent, coreOrigin),
            };
          }),
      );
    },
  };
}

export type CheckoutOperations = ReturnType<typeof createCheckoutOperations>;
