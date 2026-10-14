import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors';
import type { PaymentIntentFieldsFragment } from '../gql/graphql';
import {
  CANCEL_PAYMENT_INTENT,
  CONFIRM_PAYMENT,
  CREATE_PAYMENT_INTENT,
  PAYMENT_INTENT_QUERY,
} from '../graphql/payments';
import { requireData, run } from '../transport/errors';
import { contextForScope, type Money, type RequestContext } from '../types';

export type PaymentIntentStatus =
  | 'CREATED'
  | 'REQUIRES_ACTION'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED'
  | 'EXPIRED';

/** Where the payment is taken. Core defaults to `APP` — a website or app acting with its own credential. */
export type PaymentChannel = 'APP' | 'POS' | 'B2B';

/**
 * What the payment is *for*, in the caller's own vocabulary — `{ type: 'booking', id: '…' }`.
 *
 * Core stores it and echoes it on every webhook, so the receiver can find its own record without
 * keeping a map from intent ids.
 */
export type PaymentReference = { type: string; id: string };

/**
 * What a browser needs to open the gateway's checkout, already parsed.
 *
 * `options` is the gateway's own launch object — for Razorpay `{ key_id, order_id, amount, currency,
 * prefill }`. Hand the whole thing to `embeddedCheckout` or `openCheckout` from
 * `@vritti/vap-sdk/next/checkout`; it carries no secret, so it is safe to send to the client.
 */
export type PaymentCheckout = {
  gateway: string;
  options: Record<string, unknown>;
  /**
   * Core's address for the gateway to post the result to — the embedded page's `callback_url`. Core
   * confirms the payment there and redirects the party to the intent's `returnUrl` or `checkoutUrl`.
   * Null unless the intent was opened with one of those.
   */
  callbackUrl: string | null;
  /** Core's address for a party who cancels on the gateway's page — redirects to the `checkoutUrl`. */
  cancelUrl: string | null;
};

export type PaymentFailure = { code: string | null; message: string | null };

export type PaymentIntent = {
  id: string;
  status: PaymentIntentStatus;
  amount: Money;
  reference: PaymentReference;
  description: string | null;
  /** Null once there is nothing left to launch — succeeded, canceled, expired. */
  checkout: PaymentCheckout | null;
  failure: PaymentFailure | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CreatePaymentIntentInput = {
  /** Major units as a string — `{ currency: 'INR', value: '499.00' }`, never paise. */
  amount: Money;
  reference: PaymentReference;
  description?: string;
  customer?: { name?: string; email?: string; phone?: string };
  /**
   * Required, and the caller's to choose: the same key answers the same intent, so a retried submit
   * cannot charge twice. Derive it from the thing being paid for (`booking-123`), not from the click.
   */
  idempotencyKey: string;
  /** Echoed on every webhook. Flat strings only — core stores it as a key/value list. */
  metadata?: Record<string, string>;
  channel?: PaymentChannel;
  /**
   * Where core sends the party after the gateway's page, paid or still settling — `intent` and `order`
   * are added to its query. Its origin must be one of the app's allowed origins in Vritti Cloud.
   */
  returnUrl?: string;
  /**
   * Where core sends the party after a decline or a cancel — `payment=failed|cancelled` is added. Put
   * the attempt's retry key in it first (`checkoutRetryUrl`). Same allowed-origin rule as `returnUrl`.
   */
  checkoutUrl?: string;
};

/** What the gateway's checkout handed back, for core to verify. */
export type GatewayResponse = { orderId: string; paymentId: string; signature: string };

/**
 * The gateway launch object, parsed — or a `VapError` naming the problem.
 *
 * Guarded rather than trusted: a payload that is not a JSON object would otherwise surface much later
 * as a Razorpay modal that refuses to open, with nothing pointing back here.
 */
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

/**
 * A path core answered with, made absolute on core's own origin.
 *
 * Core answers paths because it does not know the address the world reaches it at; the SDK does — it
 * is the endpoint this client was configured with. Null without either, so a caller falls back rather
 * than handing a gateway a relative URL it would post nowhere.
 */
function onCore(path: string | null | undefined, coreOrigin: string | undefined): string | null {
  if (!path || !coreOrigin) return null;
  try {
    return new URL(path, coreOrigin).toString();
  } catch {
    return null;
  }
}

/**
 * Core's intent, reshaped for callers.
 *
 * Field by field rather than a cast, which also drops the `__typename` Apollo adds — so an `amount`
 * read here can be passed straight back as an input without core refusing the extra key.
 */
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

/** `{ a: '1' }` → `[{ key: 'a', value: '1' }]`, or nothing at all for an empty map. */
export function toKeyValues(metadata: Record<string, string> | undefined) {
  const entries = Object.entries(metadata ?? {});
  return entries.length > 0 ? entries.map(([key, value]) => ({ key, value: String(value) })) : undefined;
}

/**
 * Taking money for anything — a booking, an invoice, a donation — through the organization's
 * configured gateway.
 *
 * **Site-scoped.** Core picks the gateway account from the site, so every call sends the site this
 * SDK was configured with (or the one `forContext` names) and refuses, as a rejected promise, when
 * there is none — falling back to org would pay into the wrong account or none.
 *
 * Party optional: a guest can pay. Bind one with `forContext({ partyId })` when somebody is signed in.
 *
 * Never response-cached: every operation here is either a write or a status that must be fresh.
 *
 * For a basket, use `checkout.startFromCart` instead — it creates the order and its intent together.
 */
export function createPaymentsOperations(client: ApolloClient, context: RequestContext = {}, coreOrigin?: string) {
  // Resolved per call, not here: `build()` runs for every `forContext`, and a storefront with no site
  // configured must still be able to use everything else.
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
                returnUrl: input.returnUrl,
                checkoutUrl: input.checkoutUrl,
              },
            },
            context: requestContext,
          })
          .then((r) => toPaymentIntent(requireData(r.data).createPaymentIntent, coreOrigin)),
      );
    },

    /**
     * Hands core the gateway's response. Core verifies the signature and answers the intent as it now
     * stands — `SUCCEEDED`, or still `PROCESSING` when the gateway has not settled yet.
     *
     * Not the source of truth: the webhook is. A party who closes the tab after paying is still
     * marked paid, because core hears from the gateway directly.
     */
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

    /** One read of an intent, e.g. for a return page. There is deliberately no polling helper. */
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
