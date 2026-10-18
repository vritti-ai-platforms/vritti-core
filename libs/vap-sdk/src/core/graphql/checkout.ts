import { graphql } from '../gql/index.js';

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
