/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query CatalogListings {\n    catalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.CatalogListingsDocument,
    "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": typeof types.SendWhatsappOtpDocument,
    "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n": typeof types.VerifyWhatsappOtpDocument,
    "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": typeof types.SendSmsOtpDocument,
    "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n": typeof types.VerifySmsOtpDocument,
    "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n": typeof types.PersonFieldsFragmentDoc,
    "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n": typeof types.PersonCommunicationFieldsFragmentDoc,
    "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n": typeof types.PeopleByCommunicationDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n": typeof types.CreatePersonDocument,
    "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n": typeof types.AddPersonCommunicationDocument,
    "\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n": typeof types.MoneyFieldsFragmentDoc,
    "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      offeringVariantId\n      quantity\n      name\n      sku\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.CartFieldsFragmentDoc,
    "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    offeringVariantId\n    name\n    sku\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n": typeof types.WishlistItemFieldsFragmentDoc,
    "\n  query Cart($input: CartScopeInput!) {\n    cart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.CartDocument,
    "\n  mutation AddToCart($input: AddCartItemInput!) {\n    addToCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.AddToCartDocument,
    "\n  mutation UpdateCartItem($input: UpdateCartItemInput!) {\n    updateCartItem(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.UpdateCartItemDocument,
    "\n  mutation RemoveFromCart($input: CartItemRefInput!) {\n    removeFromCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.RemoveFromCartDocument,
    "\n  mutation ClearCart($input: CartScopeInput!) {\n    clearCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.ClearCartDocument,
    "\n  query Wishlist($input: WishlistQueryInput!) {\n    wishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": typeof types.WishlistDocument,
    "\n  mutation AddToWishlist($input: WishlistRefInput!) {\n    addToWishlist(input: $input) {\n      alreadyExists\n      wishlist {\n        ...WishlistItemFields\n      }\n    }\n  }\n": typeof types.AddToWishlistDocument,
    "\n  mutation RemoveFromWishlist($input: WishlistRefInput!) {\n    removeFromWishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": typeof types.RemoveFromWishlistDocument,
};
const documents: Documents = {
    "\n  query CatalogListings {\n    catalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": types.CatalogListingsDocument,
    "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": types.SendWhatsappOtpDocument,
    "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n": types.VerifyWhatsappOtpDocument,
    "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": types.SendSmsOtpDocument,
    "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n": types.VerifySmsOtpDocument,
    "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n": types.PersonFieldsFragmentDoc,
    "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n": types.PersonCommunicationFieldsFragmentDoc,
    "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n": types.PeopleByCommunicationDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n": types.CreatePersonDocument,
    "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n": types.AddPersonCommunicationDocument,
    "\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n": types.MoneyFieldsFragmentDoc,
    "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      offeringVariantId\n      quantity\n      name\n      sku\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n": types.CartFieldsFragmentDoc,
    "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    offeringVariantId\n    name\n    sku\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n": types.WishlistItemFieldsFragmentDoc,
    "\n  query Cart($input: CartScopeInput!) {\n    cart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.CartDocument,
    "\n  mutation AddToCart($input: AddCartItemInput!) {\n    addToCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.AddToCartDocument,
    "\n  mutation UpdateCartItem($input: UpdateCartItemInput!) {\n    updateCartItem(input: $input) {\n      ...CartFields\n    }\n  }\n": types.UpdateCartItemDocument,
    "\n  mutation RemoveFromCart($input: CartItemRefInput!) {\n    removeFromCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.RemoveFromCartDocument,
    "\n  mutation ClearCart($input: CartScopeInput!) {\n    clearCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.ClearCartDocument,
    "\n  query Wishlist($input: WishlistQueryInput!) {\n    wishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": types.WishlistDocument,
    "\n  mutation AddToWishlist($input: WishlistRefInput!) {\n    addToWishlist(input: $input) {\n      alreadyExists\n      wishlist {\n        ...WishlistItemFields\n      }\n    }\n  }\n": types.AddToWishlistDocument,
    "\n  mutation RemoveFromWishlist($input: WishlistRefInput!) {\n    removeFromWishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": types.RemoveFromWishlistDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CatalogListings {\n    catalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query CatalogListings {\n    catalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n"): (typeof documents)["\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n"): (typeof documents)["\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n"): (typeof documents)["\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n"): (typeof documents)["\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n"): (typeof documents)["\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n"): (typeof documents)["\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n"): (typeof documents)["\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n"): (typeof documents)["\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      offeringVariantId\n      quantity\n      name\n      sku\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      offeringVariantId\n      quantity\n      name\n      sku\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    offeringVariantId\n    name\n    sku\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n"): (typeof documents)["\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    offeringVariantId\n    name\n    sku\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Cart($input: CartScopeInput!) {\n    cart(input: $input) {\n      ...CartFields\n    }\n  }\n"): (typeof documents)["\n  query Cart($input: CartScopeInput!) {\n    cart(input: $input) {\n      ...CartFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddToCart($input: AddCartItemInput!) {\n    addToCart(input: $input) {\n      ...CartFields\n    }\n  }\n"): (typeof documents)["\n  mutation AddToCart($input: AddCartItemInput!) {\n    addToCart(input: $input) {\n      ...CartFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCartItem($input: UpdateCartItemInput!) {\n    updateCartItem(input: $input) {\n      ...CartFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCartItem($input: UpdateCartItemInput!) {\n    updateCartItem(input: $input) {\n      ...CartFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveFromCart($input: CartItemRefInput!) {\n    removeFromCart(input: $input) {\n      ...CartFields\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveFromCart($input: CartItemRefInput!) {\n    removeFromCart(input: $input) {\n      ...CartFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ClearCart($input: CartScopeInput!) {\n    clearCart(input: $input) {\n      ...CartFields\n    }\n  }\n"): (typeof documents)["\n  mutation ClearCart($input: CartScopeInput!) {\n    clearCart(input: $input) {\n      ...CartFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Wishlist($input: WishlistQueryInput!) {\n    wishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n"): (typeof documents)["\n  query Wishlist($input: WishlistQueryInput!) {\n    wishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddToWishlist($input: WishlistRefInput!) {\n    addToWishlist(input: $input) {\n      alreadyExists\n      wishlist {\n        ...WishlistItemFields\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddToWishlist($input: WishlistRefInput!) {\n    addToWishlist(input: $input) {\n      alreadyExists\n      wishlist {\n        ...WishlistItemFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveFromWishlist($input: WishlistRefInput!) {\n    removeFromWishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveFromWishlist($input: WishlistRefInput!) {\n    removeFromWishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;