import { graphql } from '../gql';

/**
 * Turns the signed-in party's basket into an order and opens its payment in one round trip.
 *
 * One mutation rather than "create order" then "create intent" so a failure between the two cannot
 * leave an order nobody can pay. Idempotent on `idempotencyKey`: a double-submitted checkout answers
 * the same order and intent instead of a second of each.
 */
export const START_CHECKOUT_FROM_CART = graphql(`
  mutation StartCheckoutFromCart($input: StartCheckoutInput!) {
    startCheckoutFromCart(input: $input) {
      order {
        id
        orderNumber
        total {
          ...MoneyFields
        }
      }
      paymentIntent {
        ...PaymentIntentFields
      }
    }
  }
`);
