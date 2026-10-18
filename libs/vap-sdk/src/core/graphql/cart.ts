import { graphql } from '../gql/index.js';

export const MoneyFieldsFragment = graphql(`
  fragment MoneyFields on Money {
    currency
    value
  }
`);

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
      quantity
      name
      code
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

export const CART_QUANTITIES_QUERY = graphql(`
  query CartQuantities {
    cartQuantities {
      code
      quantity
    }
  }
`);
