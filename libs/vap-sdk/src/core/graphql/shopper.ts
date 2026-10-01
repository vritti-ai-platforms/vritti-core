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

/**
 * How many of each product the shopper holds — counts only, nothing priced.
 *
 * What a product page reads to show a quantity stepper instead of "Add to cart". Cheap by design:
 * core resolves no catalogue for it, so asking on every view costs one indexed read.
 */
export const CART_QUANTITIES_QUERY = graphql(`
  query CartQuantities {
    cartQuantities {
      offeringVariantId
      quantity
    }
  }
`);

/** Which products the shopper has saved — ids only, for a product page's "Saved" state. */
export const WISHLIST_VARIANT_IDS_QUERY = graphql(`
  query WishlistVariantIds {
    wishlistVariantIds
  }
`);

/** The fields a shopper sees and edits on their own profile. */
export const ShopperProfileFieldsFragment = graphql(`
  fragment ShopperProfileFields on Person {
    id
    displayName
    firstName
    lastName
    email
    phone
  }
`);

/**
 * The signed-in shopper's own details.
 *
 * Takes no id: core reads the party from the request signature, so this answers "me" and there is
 * nothing to pass that could ask about somebody else.
 */
export const SHOPPER_PROFILE_QUERY = graphql(`
  query ShopperProfile {
    shopperProfile {
      ...ShopperProfileFields
    }
  }
`);

/**
 * The shopper editing their own details.
 *
 * No phone: it is the credential they proved by OTP, and changing it is the OTP flow rather than a
 * field on a form. Answers the profile as it now stands, including the `displayName` core composes
 * from the names.
 */
export const UPDATE_SHOPPER_PROFILE = graphql(`
  mutation UpdateShopperProfile($input: UpdateShopperProfileInput!) {
    updateShopperProfile(input: $input) {
      ...ShopperProfileFields
    }
  }
`);

/** One of the shopper's saved addresses. */
export const ShopperAddressFieldsFragment = graphql(`
  fragment ShopperAddressFields on ShopperAddress {
    id
    line1
    line2
    city
    region
    postalCode
    countryCode
    isDefault
  }
`);

/**
 * The shopper's address book.
 *
 * Every mutation answers the whole book rather than the row it touched: marking one address the
 * default unmarks another, so a single row would leave a caller redrawing a list it cannot see all
 * of.
 */
export const SHOPPER_ADDRESSES_QUERY = graphql(`
  query ShopperAddresses {
    shopperAddresses {
      ...ShopperAddressFields
    }
  }
`);

export const ADD_SHOPPER_ADDRESS = graphql(`
  mutation AddShopperAddress($input: ShopperAddressInput!) {
    addShopperAddress(input: $input) {
      ...ShopperAddressFields
    }
  }
`);

export const UPDATE_SHOPPER_ADDRESS = graphql(`
  mutation UpdateShopperAddress($input: UpdateShopperAddressInput!) {
    updateShopperAddress(input: $input) {
      ...ShopperAddressFields
    }
  }
`);

export const REMOVE_SHOPPER_ADDRESS = graphql(`
  mutation RemoveShopperAddress($input: ShopperAddressRefInput!) {
    removeShopperAddress(input: $input) {
      ...ShopperAddressFields
    }
  }
`);
