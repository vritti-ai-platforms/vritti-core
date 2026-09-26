import { graphql } from '../gql';

/**
 * The money shape every priced field uses — a currency and a major-unit **string**.
 *
 * Never parse `value` with `Number` for arithmetic. Core sums in integer minor units and formats
 * once; a float here would reintroduce exactly the rounding that avoids.
 */
export const MoneyFieldsFragment = graphql(`
  fragment MoneyFields on Money {
    currency
    value
  }
`);

/**
 * A whole basket, returned by every basket operation.
 *
 * Mutations answer with the basket rather than the line they touched, so a caller redraws from one
 * response instead of reconciling a patch against what it already had.
 */
export const CartFieldsFragment = graphql(`
  fragment CartFields on Cart {
    currencyCode
    itemCount
    subtotal {
      ...MoneyFields
    }
    items {
      id
      catalogListingId
      offeringVariantId
      quantity
      name
      sku
      isAvailable
      unitPrice {
        ...MoneyFields
      }
      lineTotal {
        ...MoneyFields
      }
    }
  }
`);

export const WishlistItemFieldsFragment = graphql(`
  fragment WishlistItemFields on WishlistItem {
    id
    catalogListingId
    offeringVariantId
    name
    sku
    isAvailable
    createdAt
    price {
      ...MoneyFields
    }
  }
`);

/**
 * The signed-in shopper's basket.
 *
 * Takes no party: core reads it from the request signature. Deliberately never response-cached —
 * a basket is the one thing a shopper expects to be exactly right the moment they look at it.
 */
export const CART_QUERY = graphql(`
  query Cart($input: CartScopeInput!) {
    cart(input: $input) {
      ...CartFields
    }
  }
`);

export const ADD_TO_CART = graphql(`
  mutation AddToCart($input: AddCartItemInput!) {
    addToCart(input: $input) {
      ...CartFields
    }
  }
`);

export const UPDATE_CART_ITEM = graphql(`
  mutation UpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) {
      ...CartFields
    }
  }
`);

export const REMOVE_FROM_CART = graphql(`
  mutation RemoveFromCart($input: CartItemRefInput!) {
    removeFromCart(input: $input) {
      ...CartFields
    }
  }
`);

export const CLEAR_CART = graphql(`
  mutation ClearCart($input: CartScopeInput!) {
    clearCart(input: $input) {
      ...CartFields
    }
  }
`);

export const WISHLIST_QUERY = graphql(`
  query Wishlist($input: WishlistQueryInput!) {
    wishlist(input: $input) {
      ...WishlistItemFields
    }
  }
`);

/**
 * Marks a listing, and says whether it was already marked.
 *
 * Idempotent — a second tap saves the same thing — so `alreadyExists` is what lets a caller say
 * "already in your wishlist" instead of claiming a save that did nothing.
 */
export const ADD_TO_WISHLIST = graphql(`
  mutation AddToWishlist($input: WishlistRefInput!) {
    addToWishlist(input: $input) {
      alreadyExists
      wishlist {
        ...WishlistItemFields
      }
    }
  }
`);

export const REMOVE_FROM_WISHLIST = graphql(`
  mutation RemoveFromWishlist($input: WishlistRefInput!) {
    removeFromWishlist(input: $input) {
      ...WishlistItemFields
    }
  }
`);
