import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors';
import {
  ADD_SHOPPER_ADDRESS,
  ADD_TO_CART,
  ADD_TO_WISHLIST,
  CART_QUANTITIES_QUERY,
  CART_QUERY,
  CLEAR_CART,
  REMOVE_FROM_CART,
  REMOVE_FROM_WISHLIST,
  REMOVE_SHOPPER_ADDRESS,
  SHOPPER_ADDRESSES_QUERY,
  SHOPPER_PROFILE_QUERY,
  UPDATE_CART_ITEM,
  UPDATE_SHOPPER_ADDRESS,
  UPDATE_SHOPPER_PROFILE,
  WISHLIST_QUERY,
  WISHLIST_VARIANT_IDS_QUERY,
} from '../graphql/shopper';
import { requireData, run } from '../transport/errors';
import { type RequestContext, withoutWorkspace } from '../types';

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
/** One of the shopper's saved addresses. */
export type ShopperAddress = {
  id: string;
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  /** Where orders go unless told otherwise. Marking one default unmarks the previous one. */
  isDefault: boolean;
};

/** An address as a shopper writes it. Clearing an optional field means sending `null`. */
export type ShopperAddressInput = {
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  isDefault?: boolean;
};

/** The shopper's own details, as their profile page shows them. */
export type ShopperProfile = {
  id: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

/** What a shopper may change about themselves. Phone is absent — that is the OTP flow. */
export type ShopperProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

/** How many of one product the shopper holds in their basket. */
export type CartQuantity = {
  offeringVariantId: string;
  quantity: number;
};

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
  // A basket is kept at a site, so its calls carry the workspace. A wishlist is the person's across
  // the whole organization, so its calls carry none — see `withoutWorkspace`.
  const requestContext = { requestContext: context };
  const wishlistContext = { requestContext: withoutWorkspace(context) };

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

    /**
     * The signed-in shopper's own details.
     *
     * Sent with no workspace, like the wishlist: a person belongs to the organization, not to one
     * of its outlets, so which site the storefront sells from has no bearing on who they are.
     */
    async profile(): Promise<ShopperProfile> {
      requireParty();
      return run(() =>
        client
          .query({ query: SHOPPER_PROFILE_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).shopperProfile as ShopperProfile),
      );
    },

    /**
     * The shopper's address book.
     *
     * Workspace-less like the profile and the wishlist: a person's addresses belong to them, not to
     * the outlet they happen to be shopping at.
     *
     * Every write answers the whole book, because marking one address the default unmarks another.
     */
    async addresses(): Promise<ShopperAddress[]> {
      requireParty();
      return run(() =>
        client
          .query({ query: SHOPPER_ADDRESSES_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).shopperAddresses as ShopperAddress[]),
      );
    },

    async addAddress(input: ShopperAddressInput): Promise<ShopperAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: ADD_SHOPPER_ADDRESS, variables: { input }, context: wishlistContext })
          .then((r) => requireData(r.data).addShopperAddress as ShopperAddress[]),
      );
    },

    async updateAddress(id: string, input: ShopperAddressInput): Promise<ShopperAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({
            mutation: UPDATE_SHOPPER_ADDRESS,
            variables: { input: { id, ...input } },
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).updateShopperAddress as ShopperAddress[]),
      );
    },

    async removeAddress(id: string): Promise<ShopperAddress[]> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: REMOVE_SHOPPER_ADDRESS, variables: { input: { id } }, context: wishlistContext })
          .then((r) => requireData(r.data).removeShopperAddress as ShopperAddress[]),
      );
    },

    /** Saves a change to those details, and answers the profile as it now stands. */
    async updateProfile(input: ShopperProfileInput): Promise<ShopperProfile> {
      requireParty();
      return run(() =>
        client
          .mutate({ mutation: UPDATE_SHOPPER_PROFILE, variables: { input }, context: wishlistContext })
          .then((r) => requireData(r.data).updateShopperProfile as ShopperProfile),
      );
    },

    /**
     * How many of each product is in the basket — for a product page's stepper.
     *
     * Counts only, so it is cheap enough to ask on every view, unlike `cart()`, which prices every
     * line. Sent at the configured site, like every other basket call.
     */
    async cartQuantities(): Promise<CartQuantity[]> {
      requireParty();
      return run(() =>
        client
          .query({ query: CART_QUANTITIES_QUERY, context: requestContext })
          .then((r) => requireData(r.data).cartQuantities as CartQuantity[]),
      );
    },

    /**
     * Which products are saved — ids only, for a product page's "Saved" state.
     *
     * Sent with no workspace, like every other wishlist call: the list is the person's, org-wide.
     */
    async savedVariantIds(): Promise<string[]> {
      requireParty();
      return run(() =>
        client
          .query({ query: WISHLIST_VARIANT_IDS_QUERY, context: wishlistContext })
          .then((r) => requireData(r.data).wishlistVariantIds as string[]),
      );
    },

    async wishlist(): Promise<WishlistItem[]> {
      requireParty();
      return run(() =>
        client
          .query({
            query: WISHLIST_QUERY,
            variables: { input: { currencyCode: currencyCode() } },
            context: wishlistContext,
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
            context: wishlistContext,
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
            context: wishlistContext,
          })
          .then((r) => requireData(r.data).removeFromWishlist as WishlistItem[]),
      );
    },
  };
}

export type ShopperOperations = ReturnType<typeof createShopperOperations>;
