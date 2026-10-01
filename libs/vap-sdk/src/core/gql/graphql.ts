/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AddCartItemInput = {
  currencyCode: string;
  offeringVariantId: string | number;
  quantity?: number;
};

export type AddPersonCommunicationInput = {
  channel: string;
  personId: string | number;
  value: string;
};

export type CartItemRefInput = {
  currencyCode: string;
  offeringVariantId: string | number;
};

export type CartScopeInput = {
  currencyCode: string;
};

export type CreatePersonInput = {
  email?: string | null | undefined;
  firstName: string;
  lastName?: string | null | undefined;
  phone?: string | null | undefined;
};

export type FindPeopleByCommunicationInput = {
  channel: string;
  value: string;
};

export type SendSmsOtpInput = {
  recipient: string;
};

export type SendWhatsappOtpInput = {
  recipient: string;
};

export type ShopperAddressInput = {
  city?: string | null | undefined;
  countryCode: string;
  isDefault?: boolean | null | undefined;
  line1: string;
  line2?: string | null | undefined;
  postalCode?: string | null | undefined;
  region?: string | null | undefined;
};

export type ShopperAddressRefInput = {
  id: string | number;
};

export type UpdateCartItemInput = {
  currencyCode: string;
  offeringVariantId: string | number;
  quantity: number;
};

export type UpdateShopperAddressInput = {
  city?: string | null | undefined;
  countryCode: string;
  id: string | number;
  isDefault?: boolean | null | undefined;
  line1: string;
  line2?: string | null | undefined;
  postalCode?: string | null | undefined;
  region?: string | null | undefined;
};

export type UpdateShopperProfileInput = {
  email?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
};

export type VerifySmsOtpInput = {
  code: string;
  recipient: string;
};

export type VerifyWhatsappOtpInput = {
  code: string;
  recipient: string;
};

export type WishlistQueryInput = {
  currencyCode: string;
};

export type WishlistRefInput = {
  currencyCode: string;
  offeringVariantId: string | number;
};

export type CatalogListingsQueryVariables = Exact<{ [key: string]: never; }>;


export type CatalogListingsQuery = { catalogListings: Array<{ id: string, offeringVariantId: string, sku: string | null, name: string | null, price: { currency: string, value: string } | null }> };

export type LeCatalogListingsQueryVariables = Exact<{ [key: string]: never; }>;


export type LeCatalogListingsQuery = { leCatalogListings: Array<{ id: string, offeringVariantId: string, sku: string | null, name: string | null, price: { currency: string, value: string } | null }> };

export type SiteCatalogListingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SiteCatalogListingsQuery = { siteCatalogListings: Array<{ id: string, offeringVariantId: string, sku: string | null, name: string | null, price: { currency: string, value: string } | null }> };

export type SendWhatsappOtpMutationVariables = Exact<{
  input: SendWhatsappOtpInput;
}>;


export type SendWhatsappOtpMutation = { sendWhatsappOtp: { sent: boolean, expiresAt: string, resendAvailableAt: string } };

export type VerifyWhatsappOtpMutationVariables = Exact<{
  input: VerifyWhatsappOtpInput;
}>;


export type VerifyWhatsappOtpMutation = { verifyWhatsappOtp: { verified: boolean } };

export type SendSmsOtpMutationVariables = Exact<{
  input: SendSmsOtpInput;
}>;


export type SendSmsOtpMutation = { sendSmsOtp: { sent: boolean, expiresAt: string, resendAvailableAt: string } };

export type VerifySmsOtpMutationVariables = Exact<{
  input: VerifySmsOtpInput;
}>;


export type VerifySmsOtpMutation = { verifySmsOtp: { verified: boolean } };

export type PersonFieldsFragment = { id: string, displayName: string, firstName: string | null, lastName: string | null, email: string | null, phone: string | null, isActive: boolean };

export type PersonCommunicationFieldsFragment = { id: string, channel: string, value: string, isPrimary: boolean, isActive: boolean };

export type PeopleByCommunicationQueryVariables = Exact<{
  input: FindPeopleByCommunicationInput;
}>;


export type PeopleByCommunicationQuery = { peopleByCommunication: Array<{ id: string, displayName: string, firstName: string | null, lastName: string | null, email: string | null, phone: string | null, isActive: boolean }> };

export type CreatePersonMutationVariables = Exact<{
  input: CreatePersonInput;
}>;


export type CreatePersonMutation = { createPerson: { id: string, displayName: string, firstName: string | null, lastName: string | null, email: string | null, phone: string | null, isActive: boolean } };

export type AddPersonCommunicationMutationVariables = Exact<{
  input: AddPersonCommunicationInput;
}>;


export type AddPersonCommunicationMutation = { addPersonCommunication: { id: string, channel: string, value: string, isPrimary: boolean, isActive: boolean } };

export type MoneyFieldsFragment = { currency: string, value: string };

export type CartFieldsFragment = { currencyCode: string, itemCount: number, subtotal: { currency: string, value: string }, items: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, quantity: number, name: string, sku: string | null, isAvailable: boolean, unitPrice: { currency: string, value: string } | null, lineTotal: { currency: string, value: string } | null }> };

export type WishlistItemFieldsFragment = { id: string, catalogListingId: string | null, offeringVariantId: string, name: string, sku: string | null, isAvailable: boolean, createdAt: string, price: { currency: string, value: string } | null };

export type CartQueryVariables = Exact<{
  input: CartScopeInput;
}>;


export type CartQuery = { cart: { currencyCode: string, itemCount: number, subtotal: { currency: string, value: string }, items: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, quantity: number, name: string, sku: string | null, isAvailable: boolean, unitPrice: { currency: string, value: string } | null, lineTotal: { currency: string, value: string } | null }> } };

export type AddToCartMutationVariables = Exact<{
  input: AddCartItemInput;
}>;


export type AddToCartMutation = { addToCart: { currencyCode: string, itemCount: number, subtotal: { currency: string, value: string }, items: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, quantity: number, name: string, sku: string | null, isAvailable: boolean, unitPrice: { currency: string, value: string } | null, lineTotal: { currency: string, value: string } | null }> } };

export type UpdateCartItemMutationVariables = Exact<{
  input: UpdateCartItemInput;
}>;


export type UpdateCartItemMutation = { updateCartItem: { currencyCode: string, itemCount: number, subtotal: { currency: string, value: string }, items: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, quantity: number, name: string, sku: string | null, isAvailable: boolean, unitPrice: { currency: string, value: string } | null, lineTotal: { currency: string, value: string } | null }> } };

export type RemoveFromCartMutationVariables = Exact<{
  input: CartItemRefInput;
}>;


export type RemoveFromCartMutation = { removeFromCart: { currencyCode: string, itemCount: number, subtotal: { currency: string, value: string }, items: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, quantity: number, name: string, sku: string | null, isAvailable: boolean, unitPrice: { currency: string, value: string } | null, lineTotal: { currency: string, value: string } | null }> } };

export type ClearCartMutationVariables = Exact<{
  input: CartScopeInput;
}>;


export type ClearCartMutation = { clearCart: { currencyCode: string, itemCount: number, subtotal: { currency: string, value: string }, items: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, quantity: number, name: string, sku: string | null, isAvailable: boolean, unitPrice: { currency: string, value: string } | null, lineTotal: { currency: string, value: string } | null }> } };

export type WishlistQueryVariables = Exact<{
  input: WishlistQueryInput;
}>;


export type WishlistQuery = { wishlist: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, name: string, sku: string | null, isAvailable: boolean, createdAt: string, price: { currency: string, value: string } | null }> };

export type AddToWishlistMutationVariables = Exact<{
  input: WishlistRefInput;
}>;


export type AddToWishlistMutation = { addToWishlist: { alreadyExists: boolean, wishlist: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, name: string, sku: string | null, isAvailable: boolean, createdAt: string, price: { currency: string, value: string } | null }> } };

export type RemoveFromWishlistMutationVariables = Exact<{
  input: WishlistRefInput;
}>;


export type RemoveFromWishlistMutation = { removeFromWishlist: Array<{ id: string, catalogListingId: string | null, offeringVariantId: string, name: string, sku: string | null, isAvailable: boolean, createdAt: string, price: { currency: string, value: string } | null }> };

export type CartQuantitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type CartQuantitiesQuery = { cartQuantities: Array<{ offeringVariantId: string, quantity: number }> };

export type WishlistVariantIdsQueryVariables = Exact<{ [key: string]: never; }>;


export type WishlistVariantIdsQuery = { wishlistVariantIds: Array<string> };

export type ShopperProfileFieldsFragment = { id: string, displayName: string, firstName: string | null, lastName: string | null, email: string | null, phone: string | null };

export type ShopperProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type ShopperProfileQuery = { shopperProfile: { id: string, displayName: string, firstName: string | null, lastName: string | null, email: string | null, phone: string | null } };

export type UpdateShopperProfileMutationVariables = Exact<{
  input: UpdateShopperProfileInput;
}>;


export type UpdateShopperProfileMutation = { updateShopperProfile: { id: string, displayName: string, firstName: string | null, lastName: string | null, email: string | null, phone: string | null } };

export type ShopperAddressFieldsFragment = { id: string, line1: string, line2: string | null, city: string | null, region: string | null, postalCode: string | null, countryCode: string, isDefault: boolean };

export type ShopperAddressesQueryVariables = Exact<{ [key: string]: never; }>;


export type ShopperAddressesQuery = { shopperAddresses: Array<{ id: string, line1: string, line2: string | null, city: string | null, region: string | null, postalCode: string | null, countryCode: string, isDefault: boolean }> };

export type AddShopperAddressMutationVariables = Exact<{
  input: ShopperAddressInput;
}>;


export type AddShopperAddressMutation = { addShopperAddress: Array<{ id: string, line1: string, line2: string | null, city: string | null, region: string | null, postalCode: string | null, countryCode: string, isDefault: boolean }> };

export type UpdateShopperAddressMutationVariables = Exact<{
  input: UpdateShopperAddressInput;
}>;


export type UpdateShopperAddressMutation = { updateShopperAddress: Array<{ id: string, line1: string, line2: string | null, city: string | null, region: string | null, postalCode: string | null, countryCode: string, isDefault: boolean }> };

export type RemoveShopperAddressMutationVariables = Exact<{
  input: ShopperAddressRefInput;
}>;


export type RemoveShopperAddressMutation = { removeShopperAddress: Array<{ id: string, line1: string, line2: string | null, city: string | null, region: string | null, postalCode: string | null, countryCode: string, isDefault: boolean }> };

export const PersonFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PersonFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Person"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<PersonFieldsFragment, unknown>;
export const PersonCommunicationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PersonCommunicationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PersonCommunication"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<PersonCommunicationFieldsFragment, unknown>;
export const MoneyFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]} as unknown as DocumentNode<MoneyFieldsFragment, unknown>;
export const CartFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CartFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cart"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"itemCount"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lineTotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]} as unknown as DocumentNode<CartFieldsFragment, unknown>;
export const WishlistItemFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WishlistItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WishlistItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]} as unknown as DocumentNode<WishlistItemFieldsFragment, unknown>;
export const ShopperProfileFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ShopperProfileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Person"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}}]} as unknown as DocumentNode<ShopperProfileFieldsFragment, unknown>;
export const ShopperAddressFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ShopperAddressFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShopperAddress"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"line1"}},{"kind":"Field","name":{"kind":"Name","value":"line2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]} as unknown as DocumentNode<ShopperAddressFieldsFragment, unknown>;
export const CatalogListingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CatalogListings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogListings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]} as unknown as DocumentNode<CatalogListingsQuery, CatalogListingsQueryVariables>;
export const LeCatalogListingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LeCatalogListings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leCatalogListings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]} as unknown as DocumentNode<LeCatalogListingsQuery, LeCatalogListingsQueryVariables>;
export const SiteCatalogListingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SiteCatalogListings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"siteCatalogListings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]} as unknown as DocumentNode<SiteCatalogListingsQuery, SiteCatalogListingsQueryVariables>;
export const SendWhatsappOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendWhatsappOtp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendWhatsappOtpInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendWhatsappOtp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sent"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"resendAvailableAt"}}]}}]}}]} as unknown as DocumentNode<SendWhatsappOtpMutation, SendWhatsappOtpMutationVariables>;
export const VerifyWhatsappOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyWhatsappOtp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifyWhatsappOtpInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyWhatsappOtp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<VerifyWhatsappOtpMutation, VerifyWhatsappOtpMutationVariables>;
export const SendSmsOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendSmsOtp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendSmsOtpInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendSmsOtp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sent"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"resendAvailableAt"}}]}}]}}]} as unknown as DocumentNode<SendSmsOtpMutation, SendSmsOtpMutationVariables>;
export const VerifySmsOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifySmsOtp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifySmsOtpInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifySmsOtp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}}]}}]} as unknown as DocumentNode<VerifySmsOtpMutation, VerifySmsOtpMutationVariables>;
export const PeopleByCommunicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PeopleByCommunication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FindPeopleByCommunicationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"peopleByCommunication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PersonFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PersonFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Person"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<PeopleByCommunicationQuery, PeopleByCommunicationQueryVariables>;
export const CreatePersonDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePerson"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePersonInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPerson"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PersonFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PersonFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Person"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<CreatePersonMutation, CreatePersonMutationVariables>;
export const AddPersonCommunicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddPersonCommunication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddPersonCommunicationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPersonCommunication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PersonCommunicationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PersonCommunicationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PersonCommunication"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"channel"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<AddPersonCommunicationMutation, AddPersonCommunicationMutationVariables>;
export const CartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Cart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CartScopeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CartFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CartFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cart"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"itemCount"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lineTotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}}]} as unknown as DocumentNode<CartQuery, CartQueryVariables>;
export const AddToCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddToCart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddCartItemInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addToCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CartFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CartFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cart"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"itemCount"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lineTotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}}]} as unknown as DocumentNode<AddToCartMutation, AddToCartMutationVariables>;
export const UpdateCartItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCartItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCartItemInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCartItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CartFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CartFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cart"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"itemCount"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lineTotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCartItemMutation, UpdateCartItemMutationVariables>;
export const RemoveFromCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveFromCart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CartItemRefInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeFromCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CartFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CartFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cart"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"itemCount"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lineTotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveFromCartMutation, RemoveFromCartMutationVariables>;
export const ClearCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearCart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CartScopeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CartFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CartFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Cart"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"itemCount"}},{"kind":"Field","name":{"kind":"Name","value":"subtotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lineTotal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]}}]} as unknown as DocumentNode<ClearCartMutation, ClearCartMutationVariables>;
export const WishlistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Wishlist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WishlistQueryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wishlist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WishlistItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WishlistItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WishlistItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]} as unknown as DocumentNode<WishlistQuery, WishlistQueryVariables>;
export const AddToWishlistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddToWishlist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WishlistRefInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addToWishlist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alreadyExists"}},{"kind":"Field","name":{"kind":"Name","value":"wishlist"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WishlistItemFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WishlistItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WishlistItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]} as unknown as DocumentNode<AddToWishlistMutation, AddToWishlistMutationVariables>;
export const RemoveFromWishlistDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveFromWishlist"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"WishlistRefInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeFromWishlist"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WishlistItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MoneyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Money"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WishlistItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WishlistItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"catalogListingId"}},{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"isAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MoneyFields"}}]}}]}}]} as unknown as DocumentNode<RemoveFromWishlistMutation, RemoveFromWishlistMutationVariables>;
export const CartQuantitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CartQuantities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cartQuantities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offeringVariantId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}}]}}]}}]} as unknown as DocumentNode<CartQuantitiesQuery, CartQuantitiesQueryVariables>;
export const WishlistVariantIdsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WishlistVariantIds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"wishlistVariantIds"}}]}}]} as unknown as DocumentNode<WishlistVariantIdsQuery, WishlistVariantIdsQueryVariables>;
export const ShopperProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ShopperProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shopperProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ShopperProfileFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ShopperProfileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Person"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}}]} as unknown as DocumentNode<ShopperProfileQuery, ShopperProfileQueryVariables>;
export const UpdateShopperProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateShopperProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateShopperProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateShopperProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ShopperProfileFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ShopperProfileFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Person"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}}]}}]} as unknown as DocumentNode<UpdateShopperProfileMutation, UpdateShopperProfileMutationVariables>;
export const ShopperAddressesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ShopperAddresses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shopperAddresses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ShopperAddressFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ShopperAddressFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShopperAddress"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"line1"}},{"kind":"Field","name":{"kind":"Name","value":"line2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]} as unknown as DocumentNode<ShopperAddressesQuery, ShopperAddressesQueryVariables>;
export const AddShopperAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddShopperAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ShopperAddressInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addShopperAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ShopperAddressFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ShopperAddressFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShopperAddress"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"line1"}},{"kind":"Field","name":{"kind":"Name","value":"line2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]} as unknown as DocumentNode<AddShopperAddressMutation, AddShopperAddressMutationVariables>;
export const UpdateShopperAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateShopperAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateShopperAddressInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateShopperAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ShopperAddressFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ShopperAddressFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShopperAddress"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"line1"}},{"kind":"Field","name":{"kind":"Name","value":"line2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]} as unknown as DocumentNode<UpdateShopperAddressMutation, UpdateShopperAddressMutationVariables>;
export const RemoveShopperAddressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveShopperAddress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ShopperAddressRefInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeShopperAddress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ShopperAddressFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ShopperAddressFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ShopperAddress"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"line1"}},{"kind":"Field","name":{"kind":"Name","value":"line2"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"region"}},{"kind":"Field","name":{"kind":"Name","value":"postalCode"}},{"kind":"Field","name":{"kind":"Name","value":"countryCode"}},{"kind":"Field","name":{"kind":"Name","value":"isDefault"}}]}}]} as unknown as DocumentNode<RemoveShopperAddressMutation, RemoveShopperAddressMutationVariables>;