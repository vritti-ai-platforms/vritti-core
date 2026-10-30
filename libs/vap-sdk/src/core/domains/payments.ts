import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors.js';
import type { PaymentIntentFieldsFragment } from '../gql/graphql.js';
import {
  CANCEL_PAYMENT_INTENT,
  CONFIRM_PAYMENT,
  CREATE_PAYMENT_INTENT,
  PAYMENT_INTENT_QUERY,
} from '../graphql/payments.js';
import { requireData, run } from '../transport/errors.js';
import { contextForScope, type Money, type RequestContext } from '../types.js';

export type PaymentIntentStatus =
  | 'CREATED'
  | 'REQUIRES_ACTION'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED'
  | 'EXPIRED';

export type PaymentChannel = 'APP' | 'POS' | 'B2B';

export type PaymentReference = { type: string; id: string };

export type PaymentCheckout = {
  gateway: string;
  options: Record<string, unknown>;
  callbackUrl: string | null;
  cancelUrl: string | null;
};

export type PaymentFailure = { code: string | null; message: string | null };

export type PaymentIntent = {
  id: string;
  status: PaymentIntentStatus;
  amount: Money;
  reference: PaymentReference;
  description: string | null;
  checkout: PaymentCheckout | null;
  failure: PaymentFailure | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CreatePaymentIntentInput = {
  amount: Money;
  reference: PaymentReference;
  description?: string;
  customer?: { name?: string; email?: string; phone?: string };
  idempotencyKey: string;
  metadata?: Record<string, string>;
  channel?: PaymentChannel;
  // The gateway to charge through, by its code, e.g. "razorpay"; which account is resolved from the store's payouts
  gatewayCode: string;
  returnUrl?: string;
  checkoutUrl?: string;
};

export type GatewayResponse = { orderId: string; paymentId: string; signature: string };

// The gateway launch object, parsed — or a `VapError` naming the problem.
export function parseCheckout(
  raw: { gateway: string; payload: string; callbackPath?: string | null; cancelPath?: string | null } | null,
  coreOrigin?: string,
): PaymentCheckout | null {
  if (!raw) return null;

  let options: unknown;
  try {
    options = JSON.parse(raw.payload);
  } catch {
    throw new VapError('The payment checkout could not be read.', 'Invalid Checkout', undefined);
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new VapError('The payment checkout could not be read.', 'Invalid Checkout', undefined);
  }
  return {
    gateway: raw.gateway,
    options: options as Record<string, unknown>,
    callbackUrl: onCore(raw.callbackPath, coreOrigin),
    cancelUrl: onCore(raw.cancelPath, coreOrigin),
  };
}

// A path core answered with, made absolute on core's own origin.
function onCore(path: string | null | undefined, coreOrigin: string | undefined): string | null {
  if (!path || !coreOrigin) return null;
  try {
    return new URL(path, coreOrigin).toString();
  } catch {
    return null;
  }
}

// Core's intent, reshaped for callers.
export function toPaymentIntent(raw: PaymentIntentFieldsFragment, coreOrigin?: string): PaymentIntent {
  return {
    id: raw.id,
    status: raw.status,
    amount: { currency: raw.amount.currency, value: raw.amount.value },
    reference: { type: raw.reference.type, id: raw.reference.id },
    description: raw.description,
    checkout: parseCheckout(raw.checkout, coreOrigin),
    failure: raw.failure ? { code: raw.failure.code, message: raw.failure.message } : null,
    paidAt: raw.paidAt,
    expiresAt: raw.expiresAt,
    createdAt: raw.createdAt,
  };
}

// `{ a: '1' }` → `[{ key: 'a', value: '1' }]`, or nothing at all for an empty map.
export function toKeyValues(metadata: Record<string, string> | undefined) {
  const entries = Object.entries(metadata ?? {});
  return entries.length > 0 ? entries.map(([key, value]) => ({ key, value: String(value) })) : undefined;
}

// Taking money for anything — a booking, an invoice, a donation — through the organization's configured gateway.
export function createPaymentsOperations(client: ApolloClient, context: RequestContext = {}, coreOrigin?: string) {
  // Resolved per call, not here: `build()` runs for every `forContext`, and a storefront with no site configured must
  // still be able to use everything else.
  const siteContext = () => ({ requestContext: contextForScope(context, 'site') });

  return {
    async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
      const requestContext = siteContext();
      return run(() =>
        client
          .mutate({
            mutation: CREATE_PAYMENT_INTENT,
            variables: {
              input: {
                amount: { currency: input.amount.currency, value: input.amount.value },
                reference: { type: input.reference.type, id: input.reference.id },
                description: input.description,
                customer: input.customer,
                idempotencyKey: input.idempotencyKey,
                metadata: toKeyValues(input.metadata),
                channel: input.channel,
                gatewayCode: input.gatewayCode,
                returnUrl: input.returnUrl,
                checkoutUrl: input.checkoutUrl,
              },
            },
            context: requestContext,
          })
          .then((r) => toPaymentIntent(requireData(r.data).createPaymentIntent, coreOrigin)),
      );
    },

    // Hands core the gateway's response.
    async confirmPayment(input: { paymentIntentId: string; gatewayResponse: GatewayResponse }): Promise<PaymentIntent> {
      const requestContext = siteContext();
      const { orderId, paymentId, signature } = input.gatewayResponse;
      return run(() =>
        client
          .mutate({
            mutation: CONFIRM_PAYMENT,
            variables: {
              input: { paymentIntentId: input.paymentIntentId, gatewayResponse: { orderId, paymentId, signature } },
            },
            context: requestContext,
          })
          .then((r) => toPaymentIntent(requireData(r.data).confirmPayment, coreOrigin)),
      );
    },

    // One read of an intent, e.g. for a return page.
    async paymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
      const requestContext = siteContext();
      return run(() =>
        client
          .query({ query: PAYMENT_INTENT_QUERY, variables: { input: { paymentIntentId } }, context: requestContext })
          .then((r) => toPaymentIntent(requireData(r.data).paymentIntent, coreOrigin)),
      );
    },

    async cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
      const requestContext = siteContext();
      return run(() =>
        client
          .mutate({
            mutation: CANCEL_PAYMENT_INTENT,
            variables: { input: { paymentIntentId } },
            context: requestContext,
          })
          .then((r) => toPaymentIntent(requireData(r.data).cancelPaymentIntent, coreOrigin)),
      );
    },
  };
}

export type PaymentsOperations = ReturnType<typeof createPaymentsOperations>;
