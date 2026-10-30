import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors.js';
import type { CheckoutFieldsFragment } from '../gql/graphql.js';
import { CART_QUERY } from '../graphql/cart.js';
import { CHECKOUT_QUERY, START_CHECKOUT } from '../graphql/checkout.js';
import { requireData, run } from '../transport/errors.js';
import { contextForScope, type Money, type RequestContext } from '../types.js';
import { type PaymentIntent, toPaymentIntent } from './payments.js';

// The reference type core stamps on the payment intent of a checkout — an intent whose `reference.type` is this
// names its checkout in `reference.id`, which is how a return page reached from the gateway finds the orders
export const CHECKOUT_REFERENCE_TYPE = 'commerce.checkout';

// OPEN: awaiting payment. PAID: the payment landed, orders being made. CONVERTED: one order per store exists.
// CANCELLED: expired or cancelled unpaid
export type CheckoutStatus = 'OPEN' | 'PAID' | 'CONVERTED' | 'CANCELLED';

// One store's share of a checkout
export type CheckoutStoreShare = { siteId: string; legalEntityId: string; subtotal: Money };

// One order a checkout became, at one store
export type CheckoutStoreOrder = { siteId: string; orderId: string; orderNumber: string };

// The cart frozen for one payment — every store, or one — and what it has become
export type Checkout = {
  id: string;
  status: CheckoutStatus;
  currencyCode: string;
  total: Money;
  sites: CheckoutStoreShare[];
  // Empty until the payment lands
  orders: CheckoutStoreOrder[];
  paymentIntent: PaymentIntent | null;
};

export type CheckoutStartInput = {
  // One store to check out on its own, one of the cart's `sites[].siteId`. Left out, every store the cart holds lines at
  siteId?: string;
  // The gateway the shopper picked, e.g. "cashfree": one of `cart.checkout.gateways`, or of that store's `gateways`
  // when one is named. Left out, the only one on offer is used; with none or several, checkout refuses and the page
  // must ask
  gatewayCode?: string;
  addressId?: string;
  notes?: string;
  idempotencyKey: string;
  returnUrl?: string;
  checkoutUrl?: string;
};

// Core's checkout, reshaped for callers.
export function toCheckout(raw: CheckoutFieldsFragment, coreOrigin?: string): Checkout {
  return {
    id: raw.id,
    status: raw.status,
    currencyCode: raw.currencyCode,
    total: { currency: raw.total.currency, value: raw.total.value },
    sites: raw.sites.map((share) => ({
      siteId: share.siteId,
      legalEntityId: share.legalEntityId,
      subtotal: { currency: share.subtotal.currency, value: share.subtotal.value },
    })),
    orders: raw.orders.map((order) => ({
      siteId: order.siteId,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
    })),
    paymentIntent: raw.paymentIntent ? toPaymentIntent(raw.paymentIntent, coreOrigin) : null,
  };
}

// Checking a cart out: order and payment intent in one call.
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

  // The picked gateway, or the only one the store — or the whole cart, when no store is named — accepts
  async function resolveGateway(picked: string | undefined, siteId: string | undefined): Promise<string> {
    if (picked) return picked;
    // The cart is priced in a currency, so without one configured the page has to pass the gateway itself
    if (!currency) throw new VapError('Choose how you want to pay.', 'Payment Gateway Required', 400);
    const cart = await run(() =>
      client
        .query({
          query: CART_QUERY,
          variables: { input: { currencyCode: currency } },
          context: { requestContext: context },
          fetchPolicy: 'no-cache',
        })
        .then((r) => requireData(r.data).cart),
    );
    const available = siteId
      ? (cart.sites.find((site) => site.siteId === siteId)?.gateways ?? [])
      : cart.checkout.gateways;
    if (available.length === 1) return available[0];
    if (available.length === 0) {
      throw new VapError(
        siteId
          ? 'Online payments are not set up for this store yet.'
          : 'Online payments are not set up for this cart yet.',
        'Payments Not Set Up',
        400,
      );
    }
    throw new VapError('Choose how you want to pay.', 'Payment Gateway Required', 400);
  }

  return {
    // Freezes the cart — every store, or one — into a checkout and opens the one payment for it. Each store's share
    // is paid out to that store's own account through the gateway the shopper picked; the orders, one per store, are
    // made once the payment lands.
    async start(input: CheckoutStartInput): Promise<Checkout> {
      requireParty();
      // Core prices every store's lines in one currency and takes the one payment in it
      if (!currency) {
        throw new VapError(
          'VAP is not configured for checkout — pass `currency` (e.g. "INR") to createVapSdk.',
          'Not Configured',
          undefined,
        );
      }
      const gatewayCode = await resolveGateway(input.gatewayCode, input.siteId);
      // Asked for from the store the visitor is shopping at — the same header the cart is read under. Core reads the
      // whole cart regardless; the header is what its permission check resolves `site.payments.create` against, since
      // an organization-level request only ever carries `org.*` permissions
      const requestContext = { requestContext: contextForScope(context, 'site') };
      return run(() =>
        client
          .mutate({
            mutation: START_CHECKOUT,
            variables: {
              input: {
                currencyCode: currency,
                siteId: input.siteId,
                gatewayCode,
                addressId: input.addressId,
                notes: input.notes,
                idempotencyKey: input.idempotencyKey,
                returnUrl: input.returnUrl,
                checkoutUrl: input.checkoutUrl,
              },
            },
            context: requestContext,
          })
          .then((r) => toCheckout(requireData(r.data).startCheckout, coreOrigin)),
      );
    },

    // Where one of the party's checkouts stands — its payment, and the orders it became — read fresh each time, which
    // is what a return page needs. Another party's checkout reads as not found.
    async find(checkoutId: string): Promise<Checkout> {
      requireParty();
      return run(() =>
        client
          .query({
            query: CHECKOUT_QUERY,
            variables: { input: { checkoutId } },
            // Under the visitor's store, like `start`, for the same permission check
            context: { requestContext: contextForScope(context, 'site') },
            fetchPolicy: 'no-cache',
          })
          .then((r) => toCheckout(requireData(r.data).checkout, coreOrigin)),
      );
    },
  };
}

export type CheckoutOperations = ReturnType<typeof createCheckoutOperations>;
