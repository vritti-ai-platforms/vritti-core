import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors.js';
import type { CartFieldsFragment } from '../gql/graphql.js';
import {
  ADD_TO_CART,
  CART_QUANTITIES_QUERY,
  CART_QUERY,
  CLEAR_CART,
  REMOVE_FROM_CART,
  UPDATE_CART_ITEM,
} from '../graphql/cart.js';
import { requireData, run } from '../transport/errors.js';
import type { Money, RequestContext } from '../types.js';

export type CartItem = {
  id: string;
  // The store the line was added at — where an edit to it has to be made
  siteId: string;
  // The priced row the line points at, or null once the store's catalogue stops carrying it
  catalogListingId: string | null;
  quantity: number;
  name: string;
  code: string;
  unitPrice: Money | null;
  lineTotal: Money | null;
  isAvailable: boolean;
};

// The party's cart at one store, with the gateways that store takes payments through
export type CartSite = {
  siteId: string;
  siteName: string;
  items: CartItem[];
  // Totals only the lines that can be bought
  subtotal: Money;
  itemCount: number;
  // Gateway codes this store accepts, e.g. "razorpay"
  gateways: string[];
};

export type Cart = {
  currencyCode: string;
  // One entry per store the party holds lines at; a store with no lines is left out
  sites: CartSite[];
  // Every store's lines in one list, for a page that does not group them by store
  items: CartItem[];
  // Totals only the lines that can be bought, across every store
  subtotal: Money;
  itemCount: number;
  checkout: {
    // Gateway codes that pay for every store in one payment. Empty when the stores share none, and the cart cannot
    // be checked out as one until a store's lines are removed
    gateways: string[];
  };
};

// Core's cart, with the stores' lines also flattened into one list
export function toCart(raw: CartFieldsFragment): Cart {
  const sites: CartSite[] = raw.sites.map((site) => ({
    siteId: site.siteId,
    siteName: site.siteName,
    items: site.items.map((item) => toCartItem(item, site.siteId)),
    subtotal: { currency: site.subtotal.currency, value: site.subtotal.value },
    itemCount: site.itemCount,
    gateways: [...site.gateways],
  }));
  return {
    currencyCode: raw.currencyCode,
    sites,
    items: sites.flatMap((site) => site.items),
    subtotal: { currency: raw.subtotal.currency, value: raw.subtotal.value },
    itemCount: raw.itemCount,
    checkout: { gateways: [...raw.checkout.gateways] },
  };
}

function toCartItem(raw: CartFieldsFragment['sites'][number]['items'][number], siteId: string): CartItem {
  return {
    id: raw.id,
    siteId,
    catalogListingId: raw.catalogListingId ?? null,
    quantity: raw.quantity,
    name: raw.name,
    code: raw.code,
    unitPrice: raw.unitPrice ? { currency: raw.unitPrice.currency, value: raw.unitPrice.value } : null,
    lineTotal: raw.lineTotal ? { currency: raw.lineTotal.currency, value: raw.lineTotal.value } : null,
    isAvailable: raw.isAvailable,
  };
}

export type CartQuantity = {
  code: string;
  quantity: number;
};

// One party's cart across the stores the storefront sells from. Each edit is made at the visitor's store.
export function createCartOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
  const requestContext = { requestContext: context };

  // The currency the storefront sells in.
  const currencyCode = (): string => {
    if (!currency) {
      throw new VapError(
        'VAP is not configured for carts — pass `currency` (e.g. "INR") to createVapSdk.',
        'Not Configured',
        undefined,
      );
    }
    return currency;
  };

  // Refused here rather than at core, so a caller that forgot `forContext` gets a message naming the mistake instead of
  // a uniform "sign in" from the far end of a signed request.
  const requireParty = (): void => {
    if (!context.partyId) {
      throw new VapError('This needs a signed-in party — use sdk.forContext({ partyId }).', 'No Party', 401);
    }
  };

  return {
    // The cart, or an empty one for a party who has added nothing.
    async items(): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .query({
            query: CART_QUERY,
            variables: { input: { currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => toCart(requireData(r.data).cart)),
      );
    },
    // Adds a listing, or raises the quantity of the line already there.
    async add(code: string, quantity = 1): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: ADD_TO_CART,
            variables: { input: { code, quantity, currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => toCart(requireData(r.data).addToCart)),
      );
    },
    // Sets a line to an exact quantity — not a delta.
    async update(code: string, quantity: number): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: UPDATE_CART_ITEM,
            variables: { input: { code, quantity, currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => toCart(requireData(r.data).updateCartItem)),
      );
    },
    async remove(code: string): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: REMOVE_FROM_CART,
            variables: { input: { code, currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => toCart(requireData(r.data).removeFromCart)),
      );
    },
    async clear(): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: CLEAR_CART,
            variables: { input: { currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => toCart(requireData(r.data).clearCart)),
      );
    },
    // How many of each product is in the cart at the visitor's store — for a product page's stepper.
    async quantities(): Promise<CartQuantity[]> {
      requireParty();
      return run(() =>
        client
          .query({ query: CART_QUANTITIES_QUERY, context: requestContext })
          .then((r) => requireData(r.data).cartQuantities as CartQuantity[]),
      );
    },
  };
}

export type CartOperations = ReturnType<typeof createCartOperations>;
