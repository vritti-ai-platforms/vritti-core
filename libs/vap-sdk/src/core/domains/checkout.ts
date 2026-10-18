import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors.js';
import { START_CHECKOUT_FROM_CART } from '../graphql/checkout.js';
import { requireData, run } from '../transport/errors.js';
import { contextForScope, type Money, type RequestContext } from '../types.js';
import { type PaymentIntent, toPaymentIntent } from './payments.js';

export type CheckoutOrder = { id: string; orderNumber: string; total: Money };

export type CheckoutSession = { order: CheckoutOrder; paymentIntent: PaymentIntent };

export type StartCheckoutInput = {
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

  return {
    // Turns the basket into an order and opens its payment.
    async startFromCart(input: StartCheckoutInput): Promise<CheckoutSession> {
      requireParty();
      const requestContext = { requestContext: contextForScope(context, 'site') };
      return run(() =>
        client
          .mutate({
            mutation: START_CHECKOUT_FROM_CART,
            variables: {
              input: {
                ...(currency ? { currencyCode: currency } : {}),
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
