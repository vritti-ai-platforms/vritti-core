import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors.js';
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
  catalogListingId: string;
  quantity: number;
  name: string;
  code: string;
  unitPrice: Money | null;
  lineTotal: Money | null;
  isAvailable: boolean;
};

export type Cart = {
  currencyCode: string;
  items: CartItem[];
  subtotal: Money;
  itemCount: number;
};

export type CartQuantity = {
  code: string;
  quantity: number;
};

// One party's basket, at the site the storefront sells from.
export function createCartOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
  const requestContext = { requestContext: context };

  // The currency the storefront sells in.
  const currencyCode = (): string => {
    if (!currency) {
      throw new VapError(
        'VAP is not configured for baskets — pass `currency` (e.g. "INR") to createVapSdk.',
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
    // The basket, or an empty one for a party who has added nothing.
    async items(): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .query({
            query: CART_QUERY,
            variables: { input: { currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).cart as Cart),
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
          .then((r) => requireData(r.data).addToCart as Cart),
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
          .then((r) => requireData(r.data).updateCartItem as Cart),
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
          .then((r) => requireData(r.data).removeFromCart as Cart),
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
          .then((r) => requireData(r.data).clearCart as Cart),
      );
    },
    // How many of each product is in the basket — for a product page's stepper.
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
