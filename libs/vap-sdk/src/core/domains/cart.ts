import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors';
import {
  ADD_TO_CART,
  CART_QUANTITIES_QUERY,
  CART_QUERY,
  CLEAR_CART,
  REMOVE_FROM_CART,
  UPDATE_CART_ITEM,
} from '../graphql/cart';
import { requireData, run } from '../transport/errors';
import type { Money, RequestContext } from '../types';

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

/** A view over the lines a party holds — no id, no status, because there is no basket row. */
export type Cart = {
  currencyCode: string;
  items: CartItem[];
  /** Totals only the available lines. */
  subtotal: Money;
  itemCount: number;
};

/** How many of one product the party holds in their basket. */
export type CartQuantity = {
  offeringVariantId: string;
  quantity: number;
};

/**
 * One party's basket, at the site the storefront sells from.
 *
 * **Reachable only through `sdk.forContext({ partyId })`.** Core reads whose basket it is from the
 * request signature rather than from an argument, so an unbound client has nobody to act for.
 *
 * Every call answers with the whole basket, so a caller redraws from one response rather than
 * patching what it already had.
 */
export function createCartOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
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
      throw new VapError('This needs a signed-in party — use sdk.forContext({ partyId }).', 'No Party', 401);
    }
  };

  return {
    /** The basket, or an empty one for a party who has added nothing. */
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
    /** Adds a listing, or raises the quantity of the line already there. */
    async add(offeringVariantId: string, quantity = 1): Promise<Cart> {
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
    async update(offeringVariantId: string, quantity: number): Promise<Cart> {
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
    async remove(offeringVariantId: string): Promise<Cart> {
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
    /**
     * How many of each product is in the basket — for a product page's stepper.
     *
     * Counts only, so it is cheap enough to ask on every view, unlike `cart()`, which prices every
     * line. Sent at the configured site, like every other basket call.
     */
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
