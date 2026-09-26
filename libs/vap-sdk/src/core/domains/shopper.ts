import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors';
import {
  ADD_TO_WISHLIST,
  ADD_TO_CART,
  CART_QUERY,
  CLEAR_CART,
  WISHLIST_QUERY,
  REMOVE_FROM_WISHLIST,
  REMOVE_FROM_CART,
  UPDATE_CART_ITEM,
} from '../graphql/shopper';
import { requireData, run } from '../transport/errors';
import type { RequestContext } from '../types';

/** A currency and a major-unit string, exactly as core sends it. See `MoneyFieldsFragment`. */
export type Money = {
  currency: string;
  /** Major units as a **string** — format it, never `Number` it for arithmetic. */
  value: string;
};

export type CartItem = {
  id: string;
  catalogListingId: string;
  /** What a storefront joins its own product page on — the variant, stable across sites. */
  offeringVariantId: string;
  quantity: number;
  name: string;
  sku: string | null;
  unitPrice: Money | null;
  lineTotal: Money | null;
  /** False once delisted, switched off, or no longer priced in the basket's currency. */
  isAvailable: boolean;
};

/** A view over the lines a shopper holds — no id, no status, because there is no basket row. */
export type Cart = {
  currencyCode: string;
  items: CartItem[];
  /** Totals only the available lines. */
  subtotal: Money;
  itemCount: number;
};

/** What `addToWishlist` answers with — the list, plus whether it was already there. */
export type WishlistAddResult = {
  alreadyExists: boolean;
  wishlist: WishlistItem[];
};

export type WishlistItem = {
  id: string;
  catalogListingId: string;
  /** What a storefront joins its own product page on — the variant, stable across sites. */
  offeringVariantId: string;
  name: string;
  sku: string | null;
  price: Money | null;
  isAvailable: boolean;
  createdAt: string;
};

/**
 * Everything a signed-in shopper has: their basket, and the things they marked.
 *
 * **Reachable only through `sdk.forContext({ partyId })`.** These operations act for one person, and
 * core reads who that is from the request signature rather than from an argument — so an unbound
 * client has nobody to act for and every call would be refused. Binding the party is what makes
 * them callable at all.
 *
 * Every basket call answers with the whole basket, and every wishlist call with the whole list,
 * so a caller redraws from one response instead of patching what it already had.
 */
export function createShopperOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
  const requestContext = { requestContext: context };

  /**
   * The currency the storefront sells in.
   *
   * Not defaulted: guessing one would price a basket in a currency nobody chose, and the mistake
   * would surface as an empty basket rather than an error — core simply finds no price for a
   * listing in a currency the catalogue does not carry.
   */
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

  /**
   * Refused here rather than at core, so a caller that forgot `forContext` gets a message naming
   * the mistake instead of a uniform "sign in" from the far end of a signed request.
   *
   * Every operation below is `async` so this lands as a **rejected promise**, not a synchronous
   * throw. A function typed `Promise<Cart>` that throws before returning one slips straight past
   * `.catch()` and surfaces as an unhandled error in the caller.
   */
  const requireParty = (): void => {
    if (!context.partyId) {
      throw new VapError('This needs a signed-in shopper — use sdk.forContext({ partyId }).', 'No Shopper', 401);
    }
  };

  return {
    /** The basket, or an empty one for a shopper who has added nothing. */
    async cart(): Promise<Cart> {
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

    /** Adds a listing, or raises the quantity of the line already there. */
    async addToCart(offeringVariantId: string, quantity = 1): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: ADD_TO_CART,
            variables: { input: { offeringVariantId, quantity, currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).addToCart as Cart),
      );
    },

    /** Sets a line to an exact quantity — not a delta. Use `removeFromCart` to take it out. */
    async updateCartItem(offeringVariantId: string, quantity: number): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: UPDATE_CART_ITEM,
            variables: { input: { offeringVariantId, quantity, currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).updateCartItem as Cart),
      );
    },

    async removeFromCart(offeringVariantId: string): Promise<Cart> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: REMOVE_FROM_CART,
            variables: { input: { offeringVariantId, currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).removeFromCart as Cart),
      );
    },

    async clearCart(): Promise<Cart> {
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

    async wishlist(): Promise<WishlistItem[]> {
      requireParty();
      return run(() =>
        client
          .query({
            query: WISHLIST_QUERY,
            variables: { input: { currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).wishlist as WishlistItem[]),
      );
    },

    /**
     * Marks a listing.
     *
     * Never fails on a repeat: `alreadyExists` reports it instead, so a caller can tell somebody it
     * was already saved rather than claiming a save that did nothing.
     */
    async addToWishlist(offeringVariantId: string): Promise<WishlistAddResult> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: ADD_TO_WISHLIST,
            variables: { input: { offeringVariantId, currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).addToWishlist as WishlistAddResult),
      );
    },

    async removeFromWishlist(offeringVariantId: string): Promise<WishlistItem[]> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: REMOVE_FROM_WISHLIST,
            variables: { input: { offeringVariantId, currencyCode: currencyCode() } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).removeFromWishlist as WishlistItem[]),
      );
    },
  };
}

export type ShopperOperations = ReturnType<typeof createShopperOperations>;
