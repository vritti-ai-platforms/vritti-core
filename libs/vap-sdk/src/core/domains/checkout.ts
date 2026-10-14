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
  /** Where core sends the party after paying — see `CreatePaymentIntentInput.returnUrl`. */
  returnUrl?: string;
  /** Where core sends the party after a decline or a cancel — see `CreatePaymentIntentInput.checkoutUrl`. */
  checkoutUrl?: string;
};

/**
 * Checking a basket out: order and payment intent in one call.
 *
 * **Reachable only through `sdk.forContext({ partyId })`**, like the basket it reads. Site-scoped
 * like every payment operation. Core prices the order in the site's own currency — its legal
 * entity's — so a storefront needs no `currency` setting to check out. One configured on the SDK is
 * still sent, and core refuses it if it disagrees with the site.
 */
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
