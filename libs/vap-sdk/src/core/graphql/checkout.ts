import { graphql } from '../gql/index.js';

export const CheckoutFieldsFragment = graphql(`
  fragment CheckoutFields on Checkout {
    id
    status
    currencyCode
    total {
      ...MoneyFields
    }
    sites {
      siteId
      legalEntityId
      subtotal {
        ...MoneyFields
      }
    }
    orders {
      siteId
      orderId
      orderNumber
    }
    paymentIntent {
      ...PaymentIntentFields
    }
  }
`);

export const START_CHECKOUT = graphql(`
  mutation StartCheckout($input: CheckoutStartInput!) {
    startCheckout(input: $input) {
      ...CheckoutFields
    }
  }
`);

export const CHECKOUT_QUERY = graphql(`
  query Checkout($input: CheckoutRefInput!) {
    checkout(input: $input) {
      ...CheckoutFields
    }
  }
`);
