import { graphql } from '../gql';

/**
 * A payment intent, as every payments operation answers it.
 *
 * `checkout.payload` is a JSON **string** on the wire — the gateway's launch object, opaque to the
 * schema so a second gateway needs no schema change. `domains/payments.ts` parses it once, so no
 * caller ever handles the string. `callbackPath` and `cancelPath` are core's own addresses for the
 * embedded page, as paths — the SDK makes them absolute on the endpoint it talks to.
 *
 * Money comes back in major units as a string, like every other priced field — see `MoneyFields`.
 */
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

/** Opens an intent — idempotent on `idempotencyKey`, so a retried submit answers the same intent. */
export const CREATE_PAYMENT_INTENT = graphql(`
  mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {
    createPaymentIntent(input: $input) {
      ...PaymentIntentFields
    }
  }
`);

/** Hands core what the gateway's checkout returned, for core to verify — never trusted client-side. */
export const CONFIRM_PAYMENT = graphql(`
  mutation ConfirmPayment($input: ConfirmPaymentInput!) {
    confirmPayment(input: $input) {
      ...PaymentIntentFields
    }
  }
`);

/** One read. Never response-cached: a payment's status is exactly the thing that must be fresh. */
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
