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

/**
 * The signed-in party's basket.
 *
 * Takes no party: core reads it from the request signature. Deliberately never response-cached —
 * a basket is the one thing a party expects to be exactly right the moment they look at it.
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

/**
 * How many of each product the party holds — counts only, nothing priced.
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
