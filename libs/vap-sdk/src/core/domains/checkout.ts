import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors';
import { START_CHECKOUT_FROM_CART } from '../graphql/checkout';
import { requireData, run } from '../transport/errors';
import { contextForScope, type Money, type RequestContext } from '../types';
import { type PaymentIntent, toPaymentIntent } from './payments';

/** The order a checkout created — what a confirmation page shows. */
export type CheckoutOrder = { id: string; orderNumber: string; total: Money };

export type CheckoutSession = { order: CheckoutOrder; paymentIntent: PaymentIntent };

export type StartCheckoutInput = {
  /** One of the party's saved addresses. Omit for a basket that ships nowhere. */
  addressId?: string;
  notes?: string;
  /**
   * Required. The same key answers the same order and intent, so a double-clicked "Pay" cannot
   * create two orders. Mint it once per rendered checkout form, not per click.
   */
  idempotencyKey: string;
};

/**
 * Checking a basket out: order and payment intent in one call.
 *
 * **Reachable only through `sdk.forContext({ partyId })`**, like the basket it reads. Site-scoped
 * like every payment operation, and priced in the configured `currency` — the same one the basket is
 * read in, so the order total matches what the party just saw.
 */
export function createCheckoutOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
  // The same two guards as the basket, for the same reasons — see `domains/cart.ts`.
  const currencyCode = (): string => {
    if (!currency) {
      throw new VapError(
        'VAP is not configured for checkout — pass `currency` (e.g. "INR") to createVapSdk.',
        'Not Configured',
        undefined,
      );
    }
    return currency;
  };

  const requireParty = (): void => {
    if (!context.partyId) {
      throw new VapError('This needs a signed-in party — use sdk.forContext({ partyId }).', 'No Party', 401);
    }
  };

  return {
    /**
     * Turns the basket into an order and opens its payment.
     *
     * Hand `paymentIntent.checkout` to `openCheckout` in the browser, then the result to
     * `payments.confirmPayment`. The order is fulfilled when core sees the payment succeed, not when
     * this returns.
     */
    async startFromCart(input: StartCheckoutInput): Promise<CheckoutSession> {
      requireParty();
      const requestContext = { requestContext: contextForScope(context, 'site') };
      return run(() =>
        client
          .mutate({
            mutation: START_CHECKOUT_FROM_CART,
            variables: {
              input: {
                currencyCode: currencyCode(),
                addressId: input.addressId,
                notes: input.notes,
                idempotencyKey: input.idempotencyKey,
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
              paymentIntent: toPaymentIntent(paymentIntent),
            };
          }),
      );
    },
  };
}

export type CheckoutOperations = ReturnType<typeof createCheckoutOperations>;
