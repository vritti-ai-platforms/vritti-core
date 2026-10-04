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
    "\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n": typeof types.MoneyFieldsFragmentDoc,
    "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      offeringVariantId\n      quantity\n      name\n      sku\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.CartFieldsFragmentDoc,
    "\n  query Cart($input: CartScopeInput!) {\n    cart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.CartDocument,
    "\n  mutation AddToCart($input: AddCartItemInput!) {\n    addToCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.AddToCartDocument,
    "\n  mutation UpdateCartItem($input: UpdateCartItemInput!) {\n    updateCartItem(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.UpdateCartItemDocument,
    "\n  mutation RemoveFromCart($input: CartItemRefInput!) {\n    removeFromCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.RemoveFromCartDocument,
    "\n  mutation ClearCart($input: CartScopeInput!) {\n    clearCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.ClearCartDocument,
    "\n  query CartQuantities {\n    cartQuantities {\n      offeringVariantId\n      quantity\n    }\n  }\n": typeof types.CartQuantitiesDocument,
    "\n  query CatalogListings {\n    catalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.CatalogListingsDocument,
    "\n  query CatalogListingsFromVariants($variantIds: [ID!]!) {\n    catalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.CatalogListingsFromVariantsDocument,
    "\n  query LeCatalogListings {\n    leCatalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.LeCatalogListingsDocument,
    "\n  query LeCatalogListingsFromVariants($variantIds: [ID!]!) {\n    leCatalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.LeCatalogListingsFromVariantsDocument,
    "\n  query SiteCatalogListings {\n    siteCatalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.SiteCatalogListingsDocument,
    "\n  query SiteCatalogListingsFromVariants($variantIds: [ID!]!) {\n    siteCatalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.SiteCatalogListingsFromVariantsDocument,
    "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": typeof types.SendWhatsappOtpDocument,
    "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n": typeof types.VerifyWhatsappOtpDocument,
    "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": typeof types.SendSmsOtpDocument,
    "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n": typeof types.VerifySmsOtpDocument,
    "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n": typeof types.PersonFieldsFragmentDoc,
    "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n": typeof types.PersonCommunicationFieldsFragmentDoc,
    "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n": typeof types.PeopleByCommunicationDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n": typeof types.CreatePersonDocument,
    "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n": typeof types.AddPersonCommunicationDocument,
    "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    offeringVariantId\n    name\n    sku\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n": typeof types.WishlistItemFieldsFragmentDoc,
    "\n  query Wishlist($input: WishlistQueryInput!) {\n    wishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": typeof types.WishlistDocument,
    "\n  mutation AddToWishlist($input: WishlistRefInput!) {\n    addToWishlist(input: $input) {\n      alreadyExists\n      wishlist {\n        ...WishlistItemFields\n      }\n    }\n  }\n": typeof types.AddToWishlistDocument,
    "\n  mutation RemoveFromWishlist($input: WishlistRefInput!) {\n    removeFromWishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": typeof types.RemoveFromWishlistDocument,
    "\n  query WishlistVariantIds {\n    wishlistVariantIds\n  }\n": typeof types.WishlistVariantIdsDocument,
    "\n  fragment PartyProfileFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n  }\n": typeof types.PartyProfileFieldsFragmentDoc,
    "\n  query PartyProfile {\n    partyProfile {\n      ...PartyProfileFields\n    }\n  }\n": typeof types.PartyProfileDocument,
    "\n  mutation UpdatePartyProfile($input: UpdatePartyProfileInput!) {\n    updatePartyProfile(input: $input) {\n      ...PartyProfileFields\n    }\n  }\n": typeof types.UpdatePartyProfileDocument,
    "\n  fragment PartyAddressFields on PartyAddress {\n    id\n    line1\n    line2\n    city\n    region\n    postalCode\n    countryCode\n    isDefault\n  }\n": typeof types.PartyAddressFieldsFragmentDoc,
    "\n  query PartyAddresses {\n    partyAddresses {\n      ...PartyAddressFields\n    }\n  }\n": typeof types.PartyAddressesDocument,
    "\n  mutation AddPartyAddress($input: PartyAddressInput!) {\n    addPartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": typeof types.AddPartyAddressDocument,
    "\n  mutation UpdatePartyAddress($input: UpdatePartyAddressInput!) {\n    updatePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": typeof types.UpdatePartyAddressDocument,
    "\n  mutation RemovePartyAddress($input: PartyAddressRefInput!) {\n    removePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": typeof types.RemovePartyAddressDocument,
};
const documents: Documents = {
    "\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n": types.MoneyFieldsFragmentDoc,
    "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      offeringVariantId\n      quantity\n      name\n      sku\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n": types.CartFieldsFragmentDoc,
    "\n  query Cart($input: CartScopeInput!) {\n    cart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.CartDocument,
    "\n  mutation AddToCart($input: AddCartItemInput!) {\n    addToCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.AddToCartDocument,
    "\n  mutation UpdateCartItem($input: UpdateCartItemInput!) {\n    updateCartItem(input: $input) {\n      ...CartFields\n    }\n  }\n": types.UpdateCartItemDocument,
    "\n  mutation RemoveFromCart($input: CartItemRefInput!) {\n    removeFromCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.RemoveFromCartDocument,
    "\n  mutation ClearCart($input: CartScopeInput!) {\n    clearCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.ClearCartDocument,
    "\n  query CartQuantities {\n    cartQuantities {\n      offeringVariantId\n      quantity\n    }\n  }\n": types.CartQuantitiesDocument,
    "\n  query CatalogListings {\n    catalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": types.CatalogListingsDocument,
    "\n  query CatalogListingsFromVariants($variantIds: [ID!]!) {\n    catalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": types.CatalogListingsFromVariantsDocument,
    "\n  query LeCatalogListings {\n    leCatalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": types.LeCatalogListingsDocument,
    "\n  query LeCatalogListingsFromVariants($variantIds: [ID!]!) {\n    leCatalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": types.LeCatalogListingsFromVariantsDocument,
    "\n  query SiteCatalogListings {\n    siteCatalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": types.SiteCatalogListingsDocument,
    "\n  query SiteCatalogListingsFromVariants($variantIds: [ID!]!) {\n    siteCatalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n": types.SiteCatalogListingsFromVariantsDocument,
    "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": types.SendWhatsappOtpDocument,
    "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n": types.VerifyWhatsappOtpDocument,
    "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": types.SendSmsOtpDocument,
    "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n": types.VerifySmsOtpDocument,
    "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n": types.PersonFieldsFragmentDoc,
    "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n": types.PersonCommunicationFieldsFragmentDoc,
    "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n": types.PeopleByCommunicationDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n": types.CreatePersonDocument,
    "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n": types.AddPersonCommunicationDocument,
    "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    offeringVariantId\n    name\n    sku\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n": types.WishlistItemFieldsFragmentDoc,
    "\n  query Wishlist($input: WishlistQueryInput!) {\n    wishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": types.WishlistDocument,
    "\n  mutation AddToWishlist($input: WishlistRefInput!) {\n    addToWishlist(input: $input) {\n      alreadyExists\n      wishlist {\n        ...WishlistItemFields\n      }\n    }\n  }\n": types.AddToWishlistDocument,
    "\n  mutation RemoveFromWishlist($input: WishlistRefInput!) {\n    removeFromWishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": types.RemoveFromWishlistDocument,
    "\n  query WishlistVariantIds {\n    wishlistVariantIds\n  }\n": types.WishlistVariantIdsDocument,
    "\n  fragment PartyProfileFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n  }\n": types.PartyProfileFieldsFragmentDoc,
    "\n  query PartyProfile {\n    partyProfile {\n      ...PartyProfileFields\n    }\n  }\n": types.PartyProfileDocument,
    "\n  mutation UpdatePartyProfile($input: UpdatePartyProfileInput!) {\n    updatePartyProfile(input: $input) {\n      ...PartyProfileFields\n    }\n  }\n": types.UpdatePartyProfileDocument,
    "\n  fragment PartyAddressFields on PartyAddress {\n    id\n    line1\n    line2\n    city\n    region\n    postalCode\n    countryCode\n    isDefault\n  }\n": types.PartyAddressFieldsFragmentDoc,
    "\n  query PartyAddresses {\n    partyAddresses {\n      ...PartyAddressFields\n    }\n  }\n": types.PartyAddressesDocument,
    "\n  mutation AddPartyAddress($input: PartyAddressInput!) {\n    addPartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": types.AddPartyAddressDocument,
    "\n  mutation UpdatePartyAddress($input: UpdatePartyAddressInput!) {\n    updatePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": types.UpdatePartyAddressDocument,
    "\n  mutation RemovePartyAddress($input: PartyAddressRefInput!) {\n    removePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": types.RemovePartyAddressDocument,
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
export function graphql(source: "\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n"): (typeof documents)["\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      offeringVariantId\n      quantity\n      name\n      sku\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      offeringVariantId\n      quantity\n      name\n      sku\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  query CartQuantities {\n    cartQuantities {\n      offeringVariantId\n      quantity\n    }\n  }\n"): (typeof documents)["\n  query CartQuantities {\n    cartQuantities {\n      offeringVariantId\n      quantity\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CatalogListings {\n    catalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query CatalogListings {\n    catalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CatalogListingsFromVariants($variantIds: [ID!]!) {\n    catalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query CatalogListingsFromVariants($variantIds: [ID!]!) {\n    catalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeCatalogListings {\n    leCatalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query LeCatalogListings {\n    leCatalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeCatalogListingsFromVariants($variantIds: [ID!]!) {\n    leCatalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query LeCatalogListingsFromVariants($variantIds: [ID!]!) {\n    leCatalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SiteCatalogListings {\n    siteCatalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query SiteCatalogListings {\n    siteCatalogListings {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SiteCatalogListingsFromVariants($variantIds: [ID!]!) {\n    siteCatalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query SiteCatalogListingsFromVariants($variantIds: [ID!]!) {\n    siteCatalogListingsFromVariants(variantIds: $variantIds) {\n      id\n      offeringVariantId\n      sku\n      name\n      price {\n        ...MoneyFields\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    offeringVariantId\n    name\n    sku\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n"): (typeof documents)["\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    offeringVariantId\n    name\n    sku\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n"];
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
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WishlistVariantIds {\n    wishlistVariantIds\n  }\n"): (typeof documents)["\n  query WishlistVariantIds {\n    wishlistVariantIds\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PartyProfileFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n  }\n"): (typeof documents)["\n  fragment PartyProfileFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PartyProfile {\n    partyProfile {\n      ...PartyProfileFields\n    }\n  }\n"): (typeof documents)["\n  query PartyProfile {\n    partyProfile {\n      ...PartyProfileFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePartyProfile($input: UpdatePartyProfileInput!) {\n    updatePartyProfile(input: $input) {\n      ...PartyProfileFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePartyProfile($input: UpdatePartyProfileInput!) {\n    updatePartyProfile(input: $input) {\n      ...PartyProfileFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PartyAddressFields on PartyAddress {\n    id\n    line1\n    line2\n    city\n    region\n    postalCode\n    countryCode\n    isDefault\n  }\n"): (typeof documents)["\n  fragment PartyAddressFields on PartyAddress {\n    id\n    line1\n    line2\n    city\n    region\n    postalCode\n    countryCode\n    isDefault\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PartyAddresses {\n    partyAddresses {\n      ...PartyAddressFields\n    }\n  }\n"): (typeof documents)["\n  query PartyAddresses {\n    partyAddresses {\n      ...PartyAddressFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddPartyAddress($input: PartyAddressInput!) {\n    addPartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n"): (typeof documents)["\n  mutation AddPartyAddress($input: PartyAddressInput!) {\n    addPartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePartyAddress($input: UpdatePartyAddressInput!) {\n    updatePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePartyAddress($input: UpdatePartyAddressInput!) {\n    updatePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemovePartyAddress($input: PartyAddressRefInput!) {\n    removePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n"): (typeof documents)["\n  mutation RemovePartyAddress($input: PartyAddressRefInput!) {\n    removePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;