import { graphql } from '../gql/index.js';

export const PaymentIntentFieldsFragment = graphql(`
  fragment PaymentIntentFields on PaymentIntent {
    id
    status
    amount {
      ...MoneyFields
    }
    reference {
      type
      id
    }
    description
    checkout {
      gateway
      payload
      callbackPath
      cancelPath
    }
    failure {
      code
      message
    }
    paidAt
    expiresAt
    createdAt
  }
`);

export const CREATE_PAYMENT_INTENT = graphql(`
  mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {
    createPaymentIntent(input: $input) {
      ...PaymentIntentFields
    }
  }
`);

export const CONFIRM_PAYMENT = graphql(`
  mutation ConfirmPayment($input: ConfirmPaymentInput!) {
    confirmPayment(input: $input) {
      ...PaymentIntentFields
    }
  }
`);

export const PAYMENT_INTENT_QUERY = graphql(`
  query PaymentIntent($input: PaymentIntentRefInput!) {
    paymentIntent(input: $input) {
      ...PaymentIntentFields
    }
  }
`);

export const CANCEL_PAYMENT_INTENT = graphql(`
  mutation CancelPaymentIntent($input: PaymentIntentRefInput!) {
    cancelPaymentIntent(input: $input) {
      ...PaymentIntentFields
    }
  }
`);
