/* eslint-disable */
import * as types from './graphql.js';
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
    "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      quantity\n      name\n      code\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n": typeof types.CartFieldsFragmentDoc,
    "\n  query Cart($input: CartScopeInput!) {\n    cart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.CartDocument,
    "\n  mutation AddToCart($input: AddCartItemInput!) {\n    addToCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.AddToCartDocument,
    "\n  mutation UpdateCartItem($input: UpdateCartItemInput!) {\n    updateCartItem(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.UpdateCartItemDocument,
    "\n  mutation RemoveFromCart($input: CartItemRefInput!) {\n    removeFromCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.RemoveFromCartDocument,
    "\n  mutation ClearCart($input: CartScopeInput!) {\n    clearCart(input: $input) {\n      ...CartFields\n    }\n  }\n": typeof types.ClearCartDocument,
    "\n  query CartQuantities {\n    cartQuantities {\n      code\n      quantity\n    }\n  }\n": typeof types.CartQuantitiesDocument,
    "\n  fragment ListingFields on CatalogListing {\n    id\n    code\n    name\n    price {\n      ...MoneyFields\n    }\n  }\n": typeof types.ListingFieldsFragmentDoc,
    "\n  query CatalogCurrencies {\n    catalogCurrencies\n  }\n": typeof types.CatalogCurrenciesDocument,
    "\n  query LeCatalogCurrencies {\n    leCatalogCurrencies\n  }\n": typeof types.LeCatalogCurrenciesDocument,
    "\n  query SiteCatalogCurrencies {\n    siteCatalogCurrencies\n  }\n": typeof types.SiteCatalogCurrenciesDocument,
    "\n  query CatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    catalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n": typeof types.CatalogListingsDocument,
    "\n  query CatalogListingByCode($code: String!, $currencyCode: String!) {\n    catalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n": typeof types.CatalogListingByCodeDocument,
    "\n  query CatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    catalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n": typeof types.CatalogListingsByCodesDocument,
    "\n  query LeCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    leCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n": typeof types.LeCatalogListingsDocument,
    "\n  query LeCatalogListingByCode($code: String!, $currencyCode: String!) {\n    leCatalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n": typeof types.LeCatalogListingByCodeDocument,
    "\n  query LeCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    leCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n": typeof types.LeCatalogListingsByCodesDocument,
    "\n  query SiteCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    siteCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n": typeof types.SiteCatalogListingsDocument,
    "\n  query SiteCatalogListingByCode($code: String!, $currencyCode: String!) {\n    siteCatalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n": typeof types.SiteCatalogListingByCodeDocument,
    "\n  query SiteCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    siteCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n": typeof types.SiteCatalogListingsByCodesDocument,
    "\n  mutation StartCheckoutFromCart($input: StartCheckoutInput!) {\n    startCheckoutFromCart(input: $input) {\n      order {\n        id\n        orderNumber\n        total {\n          ...MoneyFields\n        }\n      }\n      paymentIntent {\n        ...PaymentIntentFields\n      }\n    }\n  }\n": typeof types.StartCheckoutFromCartDocument,
    "\n  query SiteOfferingVariants($search: String, $excludeIds: [ID!], $limit: Int, $offset: Int) {\n    siteOfferingVariants(search: $search, excludeIds: $excludeIds, limit: $limit, offset: $offset) {\n      items {\n        id\n        code\n        name\n      }\n      total\n    }\n  }\n": typeof types.SiteOfferingVariantsDocument,
    "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n      codeLength\n    }\n  }\n": typeof types.SendWhatsappOtpDocument,
    "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n": typeof types.VerifyWhatsappOtpDocument,
    "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n      codeLength\n    }\n  }\n": typeof types.SendSmsOtpDocument,
    "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n": typeof types.VerifySmsOtpDocument,
    "\n  fragment PaymentIntentFields on PaymentIntent {\n    id\n    status\n    amount {\n      ...MoneyFields\n    }\n    reference {\n      type\n      id\n    }\n    description\n    checkout {\n      gateway\n      payload\n      callbackPath\n      cancelPath\n    }\n    failure {\n      code\n      message\n    }\n    paidAt\n    expiresAt\n    createdAt\n  }\n": typeof types.PaymentIntentFieldsFragmentDoc,
    "\n  mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {\n    createPaymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n": typeof types.CreatePaymentIntentDocument,
    "\n  mutation ConfirmPayment($input: ConfirmPaymentInput!) {\n    confirmPayment(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n": typeof types.ConfirmPaymentDocument,
    "\n  query PaymentIntent($input: PaymentIntentRefInput!) {\n    paymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n": typeof types.PaymentIntentDocument,
    "\n  mutation CancelPaymentIntent($input: PaymentIntentRefInput!) {\n    cancelPaymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n": typeof types.CancelPaymentIntentDocument,
    "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n": typeof types.PersonFieldsFragmentDoc,
    "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n": typeof types.PersonCommunicationFieldsFragmentDoc,
    "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n": typeof types.PeopleByCommunicationDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n": typeof types.CreatePersonDocument,
    "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n": typeof types.AddPersonCommunicationDocument,
    "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    name\n    code\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n": typeof types.WishlistItemFieldsFragmentDoc,
    "\n  query Wishlist($input: WishlistQueryInput!) {\n    wishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": typeof types.WishlistDocument,
    "\n  mutation AddToWishlist($input: WishlistRefInput!) {\n    addToWishlist(input: $input) {\n      alreadyExists\n      wishlist {\n        ...WishlistItemFields\n      }\n    }\n  }\n": typeof types.AddToWishlistDocument,
    "\n  mutation RemoveFromWishlist($input: WishlistRefInput!) {\n    removeFromWishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": typeof types.RemoveFromWishlistDocument,
    "\n  query WishlistCodes {\n    wishlistCodes\n  }\n": typeof types.WishlistCodesDocument,
    "\n  fragment PartyProfileFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n  }\n": typeof types.PartyProfileFieldsFragmentDoc,
    "\n  query PartyProfile {\n    partyProfile {\n      ...PartyProfileFields\n    }\n  }\n": typeof types.PartyProfileDocument,
    "\n  mutation UpdatePartyProfile($input: UpdatePartyProfileInput!) {\n    updatePartyProfile(input: $input) {\n      ...PartyProfileFields\n    }\n  }\n": typeof types.UpdatePartyProfileDocument,
    "\n  fragment PartyAddressFields on PartyAddress {\n    id\n    line1\n    line2\n    city\n    region\n    postalCode\n    countryCode\n    isDefault\n  }\n": typeof types.PartyAddressFieldsFragmentDoc,
    "\n  query PartyAddresses {\n    partyAddresses {\n      ...PartyAddressFields\n    }\n  }\n": typeof types.PartyAddressesDocument,
    "\n  mutation AddPartyAddress($input: PartyAddressInput!) {\n    addPartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": typeof types.AddPartyAddressDocument,
    "\n  mutation UpdatePartyAddress($input: UpdatePartyAddressInput!) {\n    updatePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": typeof types.UpdatePartyAddressDocument,
    "\n  mutation RemovePartyAddress($input: PartyAddressRefInput!) {\n    removePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": typeof types.RemovePartyAddressDocument,
    "\n  query AppSites($types: [AppSiteType!]) {\n    appSites(types: $types) {\n      id\n      code\n      name\n      type\n      timezone\n      legalEntityId\n      currencyCode\n      sortOrder\n    }\n  }\n": typeof types.AppSitesDocument,
    "\n  query AppLegalEntities {\n    appLegalEntities {\n      id\n      code\n      name\n      currencyCode\n      country\n      sortOrder\n    }\n  }\n": typeof types.AppLegalEntitiesDocument,
};
const documents: Documents = {
    "\n  fragment MoneyFields on Money {\n    currency\n    value\n  }\n": types.MoneyFieldsFragmentDoc,
    "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      quantity\n      name\n      code\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n": types.CartFieldsFragmentDoc,
    "\n  query Cart($input: CartScopeInput!) {\n    cart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.CartDocument,
    "\n  mutation AddToCart($input: AddCartItemInput!) {\n    addToCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.AddToCartDocument,
    "\n  mutation UpdateCartItem($input: UpdateCartItemInput!) {\n    updateCartItem(input: $input) {\n      ...CartFields\n    }\n  }\n": types.UpdateCartItemDocument,
    "\n  mutation RemoveFromCart($input: CartItemRefInput!) {\n    removeFromCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.RemoveFromCartDocument,
    "\n  mutation ClearCart($input: CartScopeInput!) {\n    clearCart(input: $input) {\n      ...CartFields\n    }\n  }\n": types.ClearCartDocument,
    "\n  query CartQuantities {\n    cartQuantities {\n      code\n      quantity\n    }\n  }\n": types.CartQuantitiesDocument,
    "\n  fragment ListingFields on CatalogListing {\n    id\n    code\n    name\n    price {\n      ...MoneyFields\n    }\n  }\n": types.ListingFieldsFragmentDoc,
    "\n  query CatalogCurrencies {\n    catalogCurrencies\n  }\n": types.CatalogCurrenciesDocument,
    "\n  query LeCatalogCurrencies {\n    leCatalogCurrencies\n  }\n": types.LeCatalogCurrenciesDocument,
    "\n  query SiteCatalogCurrencies {\n    siteCatalogCurrencies\n  }\n": types.SiteCatalogCurrenciesDocument,
    "\n  query CatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    catalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n": types.CatalogListingsDocument,
    "\n  query CatalogListingByCode($code: String!, $currencyCode: String!) {\n    catalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n": types.CatalogListingByCodeDocument,
    "\n  query CatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    catalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n": types.CatalogListingsByCodesDocument,
    "\n  query LeCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    leCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n": types.LeCatalogListingsDocument,
    "\n  query LeCatalogListingByCode($code: String!, $currencyCode: String!) {\n    leCatalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n": types.LeCatalogListingByCodeDocument,
    "\n  query LeCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    leCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n": types.LeCatalogListingsByCodesDocument,
    "\n  query SiteCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    siteCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n": types.SiteCatalogListingsDocument,
    "\n  query SiteCatalogListingByCode($code: String!, $currencyCode: String!) {\n    siteCatalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n": types.SiteCatalogListingByCodeDocument,
    "\n  query SiteCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    siteCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n": types.SiteCatalogListingsByCodesDocument,
    "\n  mutation StartCheckoutFromCart($input: StartCheckoutInput!) {\n    startCheckoutFromCart(input: $input) {\n      order {\n        id\n        orderNumber\n        total {\n          ...MoneyFields\n        }\n      }\n      paymentIntent {\n        ...PaymentIntentFields\n      }\n    }\n  }\n": types.StartCheckoutFromCartDocument,
    "\n  query SiteOfferingVariants($search: String, $excludeIds: [ID!], $limit: Int, $offset: Int) {\n    siteOfferingVariants(search: $search, excludeIds: $excludeIds, limit: $limit, offset: $offset) {\n      items {\n        id\n        code\n        name\n      }\n      total\n    }\n  }\n": types.SiteOfferingVariantsDocument,
    "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n      codeLength\n    }\n  }\n": types.SendWhatsappOtpDocument,
    "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n": types.VerifyWhatsappOtpDocument,
    "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n      codeLength\n    }\n  }\n": types.SendSmsOtpDocument,
    "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n": types.VerifySmsOtpDocument,
    "\n  fragment PaymentIntentFields on PaymentIntent {\n    id\n    status\n    amount {\n      ...MoneyFields\n    }\n    reference {\n      type\n      id\n    }\n    description\n    checkout {\n      gateway\n      payload\n      callbackPath\n      cancelPath\n    }\n    failure {\n      code\n      message\n    }\n    paidAt\n    expiresAt\n    createdAt\n  }\n": types.PaymentIntentFieldsFragmentDoc,
    "\n  mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {\n    createPaymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n": types.CreatePaymentIntentDocument,
    "\n  mutation ConfirmPayment($input: ConfirmPaymentInput!) {\n    confirmPayment(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n": types.ConfirmPaymentDocument,
    "\n  query PaymentIntent($input: PaymentIntentRefInput!) {\n    paymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n": types.PaymentIntentDocument,
    "\n  mutation CancelPaymentIntent($input: PaymentIntentRefInput!) {\n    cancelPaymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n": types.CancelPaymentIntentDocument,
    "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n": types.PersonFieldsFragmentDoc,
    "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n": types.PersonCommunicationFieldsFragmentDoc,
    "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n": types.PeopleByCommunicationDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n": types.CreatePersonDocument,
    "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n": types.AddPersonCommunicationDocument,
    "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    name\n    code\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n": types.WishlistItemFieldsFragmentDoc,
    "\n  query Wishlist($input: WishlistQueryInput!) {\n    wishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": types.WishlistDocument,
    "\n  mutation AddToWishlist($input: WishlistRefInput!) {\n    addToWishlist(input: $input) {\n      alreadyExists\n      wishlist {\n        ...WishlistItemFields\n      }\n    }\n  }\n": types.AddToWishlistDocument,
    "\n  mutation RemoveFromWishlist($input: WishlistRefInput!) {\n    removeFromWishlist(input: $input) {\n      ...WishlistItemFields\n    }\n  }\n": types.RemoveFromWishlistDocument,
    "\n  query WishlistCodes {\n    wishlistCodes\n  }\n": types.WishlistCodesDocument,
    "\n  fragment PartyProfileFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n  }\n": types.PartyProfileFieldsFragmentDoc,
    "\n  query PartyProfile {\n    partyProfile {\n      ...PartyProfileFields\n    }\n  }\n": types.PartyProfileDocument,
    "\n  mutation UpdatePartyProfile($input: UpdatePartyProfileInput!) {\n    updatePartyProfile(input: $input) {\n      ...PartyProfileFields\n    }\n  }\n": types.UpdatePartyProfileDocument,
    "\n  fragment PartyAddressFields on PartyAddress {\n    id\n    line1\n    line2\n    city\n    region\n    postalCode\n    countryCode\n    isDefault\n  }\n": types.PartyAddressFieldsFragmentDoc,
    "\n  query PartyAddresses {\n    partyAddresses {\n      ...PartyAddressFields\n    }\n  }\n": types.PartyAddressesDocument,
    "\n  mutation AddPartyAddress($input: PartyAddressInput!) {\n    addPartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": types.AddPartyAddressDocument,
    "\n  mutation UpdatePartyAddress($input: UpdatePartyAddressInput!) {\n    updatePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": types.UpdatePartyAddressDocument,
    "\n  mutation RemovePartyAddress($input: PartyAddressRefInput!) {\n    removePartyAddress(input: $input) {\n      ...PartyAddressFields\n    }\n  }\n": types.RemovePartyAddressDocument,
    "\n  query AppSites($types: [AppSiteType!]) {\n    appSites(types: $types) {\n      id\n      code\n      name\n      type\n      timezone\n      legalEntityId\n      currencyCode\n      sortOrder\n    }\n  }\n": types.AppSitesDocument,
    "\n  query AppLegalEntities {\n    appLegalEntities {\n      id\n      code\n      name\n      currencyCode\n      country\n      sortOrder\n    }\n  }\n": types.AppLegalEntitiesDocument,
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
export function graphql(source: "\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      quantity\n      name\n      code\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment CartFields on Cart {\n    currencyCode\n    itemCount\n    subtotal {\n      ...MoneyFields\n    }\n    items {\n      id\n      catalogListingId\n      quantity\n      name\n      code\n      isAvailable\n      unitPrice {\n        ...MoneyFields\n      }\n      lineTotal {\n        ...MoneyFields\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  query CartQuantities {\n    cartQuantities {\n      code\n      quantity\n    }\n  }\n"): (typeof documents)["\n  query CartQuantities {\n    cartQuantities {\n      code\n      quantity\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ListingFields on CatalogListing {\n    id\n    code\n    name\n    price {\n      ...MoneyFields\n    }\n  }\n"): (typeof documents)["\n  fragment ListingFields on CatalogListing {\n    id\n    code\n    name\n    price {\n      ...MoneyFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CatalogCurrencies {\n    catalogCurrencies\n  }\n"): (typeof documents)["\n  query CatalogCurrencies {\n    catalogCurrencies\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeCatalogCurrencies {\n    leCatalogCurrencies\n  }\n"): (typeof documents)["\n  query LeCatalogCurrencies {\n    leCatalogCurrencies\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SiteCatalogCurrencies {\n    siteCatalogCurrencies\n  }\n"): (typeof documents)["\n  query SiteCatalogCurrencies {\n    siteCatalogCurrencies\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    catalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query CatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    catalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CatalogListingByCode($code: String!, $currencyCode: String!) {\n    catalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query CatalogListingByCode($code: String!, $currencyCode: String!) {\n    catalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    catalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n"): (typeof documents)["\n  query CatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    catalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    leCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query LeCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    leCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeCatalogListingByCode($code: String!, $currencyCode: String!) {\n    leCatalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query LeCatalogListingByCode($code: String!, $currencyCode: String!) {\n    leCatalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    leCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n"): (typeof documents)["\n  query LeCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    leCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SiteCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    siteCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query SiteCatalogListings($currencyCode: String!, $filters: [FilterInput!], $page: Int, $perPage: Int, $sort: ListingSort) {\n    siteCatalogListings(currencyCode: $currencyCode, filters: $filters, page: $page, perPage: $perPage, sort: $sort) {\n      items {\n        ...ListingFields\n      }\n      total\n      page\n      perPage\n      filters {\n        kind\n        code\n        name\n        sortOrder\n        values {\n          code\n          name\n          count\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SiteCatalogListingByCode($code: String!, $currencyCode: String!) {\n    siteCatalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query SiteCatalogListingByCode($code: String!, $currencyCode: String!) {\n    siteCatalogListingByCode(code: $code, currencyCode: $currencyCode) {\n      listing {\n        ...ListingFields\n      }\n      axes {\n        code\n        name\n        sortOrder\n        options {\n          code\n          name\n          selected\n          variantCode\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SiteCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    siteCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n"): (typeof documents)["\n  query SiteCatalogListingsByCodes($codes: [String!]!, $currencyCode: String!, $filters: [FilterInput!]) {\n    siteCatalogListingsByCodes(codes: $codes, currencyCode: $currencyCode, filters: $filters) {\n      ...ListingFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartCheckoutFromCart($input: StartCheckoutInput!) {\n    startCheckoutFromCart(input: $input) {\n      order {\n        id\n        orderNumber\n        total {\n          ...MoneyFields\n        }\n      }\n      paymentIntent {\n        ...PaymentIntentFields\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation StartCheckoutFromCart($input: StartCheckoutInput!) {\n    startCheckoutFromCart(input: $input) {\n      order {\n        id\n        orderNumber\n        total {\n          ...MoneyFields\n        }\n      }\n      paymentIntent {\n        ...PaymentIntentFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SiteOfferingVariants($search: String, $excludeIds: [ID!], $limit: Int, $offset: Int) {\n    siteOfferingVariants(search: $search, excludeIds: $excludeIds, limit: $limit, offset: $offset) {\n      items {\n        id\n        code\n        name\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query SiteOfferingVariants($search: String, $excludeIds: [ID!], $limit: Int, $offset: Int) {\n    siteOfferingVariants(search: $search, excludeIds: $excludeIds, limit: $limit, offset: $offset) {\n      items {\n        id\n        code\n        name\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n      codeLength\n    }\n  }\n"): (typeof documents)["\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n      codeLength\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n      codeLength\n    }\n  }\n"): (typeof documents)["\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n      codeLength\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n"): (typeof documents)["\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PaymentIntentFields on PaymentIntent {\n    id\n    status\n    amount {\n      ...MoneyFields\n    }\n    reference {\n      type\n      id\n    }\n    description\n    checkout {\n      gateway\n      payload\n      callbackPath\n      cancelPath\n    }\n    failure {\n      code\n      message\n    }\n    paidAt\n    expiresAt\n    createdAt\n  }\n"): (typeof documents)["\n  fragment PaymentIntentFields on PaymentIntent {\n    id\n    status\n    amount {\n      ...MoneyFields\n    }\n    reference {\n      type\n      id\n    }\n    description\n    checkout {\n      gateway\n      payload\n      callbackPath\n      cancelPath\n    }\n    failure {\n      code\n      message\n    }\n    paidAt\n    expiresAt\n    createdAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {\n    createPaymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePaymentIntent($input: CreatePaymentIntentInput!) {\n    createPaymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConfirmPayment($input: ConfirmPaymentInput!) {\n    confirmPayment(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n"): (typeof documents)["\n  mutation ConfirmPayment($input: ConfirmPaymentInput!) {\n    confirmPayment(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PaymentIntent($input: PaymentIntentRefInput!) {\n    paymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n"): (typeof documents)["\n  query PaymentIntent($input: PaymentIntentRefInput!) {\n    paymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelPaymentIntent($input: PaymentIntentRefInput!) {\n    cancelPaymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n"): (typeof documents)["\n  mutation CancelPaymentIntent($input: PaymentIntentRefInput!) {\n    cancelPaymentIntent(input: $input) {\n      ...PaymentIntentFields\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    name\n    code\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n"): (typeof documents)["\n  fragment WishlistItemFields on WishlistItem {\n    id\n    catalogListingId\n    name\n    code\n    isAvailable\n    createdAt\n    price {\n      ...MoneyFields\n    }\n  }\n"];
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
export function graphql(source: "\n  query WishlistCodes {\n    wishlistCodes\n  }\n"): (typeof documents)["\n  query WishlistCodes {\n    wishlistCodes\n  }\n"];
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
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AppSites($types: [AppSiteType!]) {\n    appSites(types: $types) {\n      id\n      code\n      name\n      type\n      timezone\n      legalEntityId\n      currencyCode\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  query AppSites($types: [AppSiteType!]) {\n    appSites(types: $types) {\n      id\n      code\n      name\n      type\n      timezone\n      legalEntityId\n      currencyCode\n      sortOrder\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AppLegalEntities {\n    appLegalEntities {\n      id\n      code\n      name\n      currencyCode\n      country\n      sortOrder\n    }\n  }\n"): (typeof documents)["\n  query AppLegalEntities {\n    appLegalEntities {\n      id\n      code\n      name\n      currencyCode\n      country\n      sortOrder\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;