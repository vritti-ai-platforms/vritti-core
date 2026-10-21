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

export const CHECKOUT_PAYMENT_GATEWAYS = graphql(`
  query CheckoutPaymentGateways($input: CheckoutPaymentGatewaysInput) {
    checkoutPaymentGateways(input: $input) {
      id
      gatewayCode
      label
    }
  }
`);
