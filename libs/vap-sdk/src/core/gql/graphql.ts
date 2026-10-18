/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };

import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AddCartItemInput = {
  code: string;
  currencyCode: string;
  quantity?: number;
};

export type AddPersonCommunicationInput = {
  channel: string;
  personId: string | number;
  value: string;
};

export type AppSiteType = 'OUTLET' | 'PRODUCTION' | 'WAREHOUSE';

export type CartItemRefInput = {
  code: string;
  currencyCode: string;
};

export type CartScopeInput = {
  currencyCode: string;
};

export type ConfirmPaymentInput = {
  gatewayResponse: GatewayResponseInput;
  paymentIntentId: string | number;
};

export type CreatePaymentIntentInput = {
  amount: MoneyInput;
  channel?: PaymentChannel | null | undefined;
  /** Where the hosted checkout sends the shopper back to after a failed or cancelled payment. Its origin must be one of the app's allowed origins. */
  checkoutUrl?: string | null | undefined;
  customer?: PaymentCustomerInput | null | undefined;
  description?: string | null | undefined;
  idempotencyKey: string;
  metadata?: Array<KeyValueInput> | null | undefined;
  reference: PaymentReferenceInput;
  /** Where the hosted checkout sends the shopper once paid. Its origin must be one of the app's allowed origins. */
  returnUrl?: string | null | undefined;
};

export type CreatePersonInput = {
  email?: string | null | undefined;
  firstName: string;
  lastName?: string | null | undefined;
  phone?: string | null | undefined;
};

export type FilterInput = {
  code: string;
  values: Array<string>;
};

export type FilterKind = 'ATTRIBUTE' | 'DIMENSION';

export type FindPeopleByCommunicationInput = {
  channel: string;
  value: string;
};

export type GatewayResponseInput = {
  orderId: string;
  paymentId: string;
  signature: string;
};

export type KeyValueInput = {
  key: string;
  value: string;
};

export type ListingSort = 'FEATURED' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC';

export type MoneyInput = {
  currency: string;
  value: string;
};

export type PartyAddressInput = {
  city?: string | null | undefined;
  countryCode: string;
  isDefault?: boolean | null | undefined;
  line1: string;
  line2?: string | null | undefined;
  postalCode?: string | null | undefined;
  region?: string | null | undefined;
};

export type PartyAddressRefInput = {
  id: string | number;
};

export type PaymentChannel = 'APP' | 'B2B' | 'POS';

export type PaymentCustomerInput = {
  email?: string | null | undefined;
  name?: string | null | undefined;
  phone?: string | null | undefined;
};

export type PaymentIntentRefInput = {
  paymentIntentId: string | number;
};

export type PaymentIntentStatus =
  | 'CANCELED'
  | 'CREATED'
  | 'EXPIRED'
  | 'FAILED'
  | 'PROCESSING'
  | 'REQUIRES_ACTION'
  | 'SUCCEEDED';

export type PaymentReferenceInput = {
  id: string;
  type: string;
};

export type SendSmsOtpInput = {
  recipient: string;
};

export type SendWhatsappOtpInput = {
  recipient: string;
};

export type StartCheckoutInput = {
  addressId?: string | number | null | undefined;
  /** Where the hosted checkout sends the shopper back to after a failed or cancelled payment. Its origin must be one of the app's allowed origins. */
  checkoutUrl?: string | null | undefined;
  /** Optional. The site's currency is used; a different value is refused. */
  currencyCode?: string | null | undefined;
  idempotencyKey: string;
  notes?: string | null | undefined;
  /** Where the hosted checkout sends the shopper once paid. Its origin must be one of the app's allowed origins. */
  returnUrl?: string | null | undefined;
};

export type UpdateCartItemInput = {
  code: string;
  currencyCode: string;
  quantity: number;
};

export type UpdatePartyAddressInput = {
  city?: string | null | undefined;
  countryCode: string;
  id: string | number;
  isDefault?: boolean | null | undefined;
  line1: string;
  line2?: string | null | undefined;
  postalCode?: string | null | undefined;
  region?: string | null | undefined;
};

export type UpdatePartyProfileInput = {
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
  code: string;
  currencyCode: string;
};

export type MoneyFieldsFragment = { currency: string; value: string };

export type CartFieldsFragment = {
  currencyCode: string;
  itemCount: number;
  subtotal: { currency: string; value: string };
  items: Array<{
    id: string;
    catalogListingId: string | null;
    quantity: number;
    name: string;
    code: string;
    isAvailable: boolean;
    unitPrice: { currency: string; value: string } | null;
    lineTotal: { currency: string; value: string } | null;
  }>;
};

export type CartQueryVariables = Exact<{
  input: CartScopeInput;
}>;

export type CartQuery = {
  cart: {
    currencyCode: string;
    itemCount: number;
    subtotal: { currency: string; value: string };
    items: Array<{
      id: string;
      catalogListingId: string | null;
      quantity: number;
      name: string;
      code: string;
      isAvailable: boolean;
      unitPrice: { currency: string; value: string } | null;
      lineTotal: { currency: string; value: string } | null;
    }>;
  };
};

export type AddToCartMutationVariables = Exact<{
  input: AddCartItemInput;
}>;

export type AddToCartMutation = {
  addToCart: {
    currencyCode: string;
    itemCount: number;
    subtotal: { currency: string; value: string };
    items: Array<{
      id: string;
      catalogListingId: string | null;
      quantity: number;
      name: string;
      code: string;
      isAvailable: boolean;
      unitPrice: { currency: string; value: string } | null;
      lineTotal: { currency: string; value: string } | null;
    }>;
  };
};

export type UpdateCartItemMutationVariables = Exact<{
  input: UpdateCartItemInput;
}>;

export type UpdateCartItemMutation = {
  updateCartItem: {
    currencyCode: string;
    itemCount: number;
    subtotal: { currency: string; value: string };
    items: Array<{
      id: string;
      catalogListingId: string | null;
      quantity: number;
      name: string;
      code: string;
      isAvailable: boolean;
      unitPrice: { currency: string; value: string } | null;
      lineTotal: { currency: string; value: string } | null;
    }>;
  };
};

export type RemoveFromCartMutationVariables = Exact<{
  input: CartItemRefInput;
}>;

export type RemoveFromCartMutation = {
  removeFromCart: {
    currencyCode: string;
    itemCount: number;
    subtotal: { currency: string; value: string };
    items: Array<{
      id: string;
      catalogListingId: string | null;
      quantity: number;
      name: string;
      code: string;
      isAvailable: boolean;
      unitPrice: { currency: string; value: string } | null;
      lineTotal: { currency: string; value: string } | null;
    }>;
  };
};

export type ClearCartMutationVariables = Exact<{
  input: CartScopeInput;
}>;

export type ClearCartMutation = {
  clearCart: {
    currencyCode: string;
    itemCount: number;
    subtotal: { currency: string; value: string };
    items: Array<{
      id: string;
      catalogListingId: string | null;
      quantity: number;
      name: string;
      code: string;
      isAvailable: boolean;
      unitPrice: { currency: string; value: string } | null;
      lineTotal: { currency: string; value: string } | null;
    }>;
  };
};

export type CartQuantitiesQueryVariables = Exact<{ [key: string]: never }>;

export type CartQuantitiesQuery = { cartQuantities: Array<{ code: string; quantity: number }> };

export type ListingFieldsFragment = {
  id: string;
  code: string;
  name: string;
  price: { currency: string; value: string };
};

export type CatalogCurrenciesQueryVariables = Exact<{ [key: string]: never }>;

export type CatalogCurrenciesQuery = { catalogCurrencies: Array<string> };

export type LeCatalogCurrenciesQueryVariables = Exact<{ [key: string]: never }>;

export type LeCatalogCurrenciesQuery = { leCatalogCurrencies: Array<string> };

export type SiteCatalogCurrenciesQueryVariables = Exact<{ [key: string]: never }>;

export type SiteCatalogCurrenciesQuery = { siteCatalogCurrencies: Array<string> };

export type CatalogListingsQueryVariables = Exact<{
  currencyCode: string;
  filters?: Array<FilterInput> | FilterInput | null | undefined;
  page?: number | null | undefined;
  perPage?: number | null | undefined;
  sort?: ListingSort | null | undefined;
}>;

export type CatalogListingsQuery = {
  catalogListings: {
    total: number;
    page: number;
    perPage: number;
    items: Array<{ id: string; code: string; name: string; price: { currency: string; value: string } }>;
    filters: Array<{
      kind: FilterKind;
      code: string;
      name: string;
      sortOrder: number;
      values: Array<{ code: string; name: string; count: number }>;
    }>;
  };
};

export type CatalogListingByCodeQueryVariables = Exact<{
  code: string;
  currencyCode: string;
}>;

export type CatalogListingByCodeQuery = {
  catalogListingByCode: {
    listing: { id: string; code: string; name: string; price: { currency: string; value: string } };
    axes: Array<{
      code: string;
      name: string;
      sortOrder: number;
      options: Array<{ code: string; name: string; selected: boolean; variantCode: string | null }>;
    }>;
  } | null;
};

export type CatalogListingsByCodesQueryVariables = Exact<{
  codes: Array<string> | string;
  currencyCode: string;
  filters?: Array<FilterInput> | FilterInput | null | undefined;
}>;

export type CatalogListingsByCodesQuery = {
  catalogListingsByCodes: Array<{ id: string; code: string; name: string; price: { currency: string; value: string } }>;
};

export type LeCatalogListingsQueryVariables = Exact<{
  currencyCode: string;
  filters?: Array<FilterInput> | FilterInput | null | undefined;
  page?: number | null | undefined;
  perPage?: number | null | undefined;
  sort?: ListingSort | null | undefined;
}>;

export type LeCatalogListingsQuery = {
  leCatalogListings: {
    total: number;
    page: number;
    perPage: number;
    items: Array<{ id: string; code: string; name: string; price: { currency: string; value: string } }>;
    filters: Array<{
      kind: FilterKind;
      code: string;
      name: string;
      sortOrder: number;
      values: Array<{ code: string; name: string; count: number }>;
    }>;
  };
};

export type LeCatalogListingByCodeQueryVariables = Exact<{
  code: string;
  currencyCode: string;
}>;

export type LeCatalogListingByCodeQuery = {
  leCatalogListingByCode: {
    listing: { id: string; code: string; name: string; price: { currency: string; value: string } };
    axes: Array<{
      code: string;
      name: string;
      sortOrder: number;
      options: Array<{ code: string; name: string; selected: boolean; variantCode: string | null }>;
    }>;
  } | null;
};

export type LeCatalogListingsByCodesQueryVariables = Exact<{
  codes: Array<string> | string;
  currencyCode: string;
  filters?: Array<FilterInput> | FilterInput | null | undefined;
}>;

export type LeCatalogListingsByCodesQuery = {
  leCatalogListingsByCodes: Array<{
    id: string;
    code: string;
    name: string;
    price: { currency: string; value: string };
  }>;
};

export type SiteCatalogListingsQueryVariables = Exact<{
  currencyCode: string;
  filters?: Array<FilterInput> | FilterInput | null | undefined;
  page?: number | null | undefined;
  perPage?: number | null | undefined;
  sort?: ListingSort | null | undefined;
}>;

export type SiteCatalogListingsQuery = {
  siteCatalogListings: {
    total: number;
    page: number;
    perPage: number;
    items: Array<{ id: string; code: string; name: string; price: { currency: string; value: string } }>;
    filters: Array<{
      kind: FilterKind;
      code: string;
      name: string;
      sortOrder: number;
      values: Array<{ code: string; name: string; count: number }>;
    }>;
  };
};

export type SiteCatalogListingByCodeQueryVariables = Exact<{
  code: string;
  currencyCode: string;
}>;

export type SiteCatalogListingByCodeQuery = {
  siteCatalogListingByCode: {
    listing: { id: string; code: string; name: string; price: { currency: string; value: string } };
    axes: Array<{
      code: string;
      name: string;
      sortOrder: number;
      options: Array<{ code: string; name: string; selected: boolean; variantCode: string | null }>;
    }>;
  } | null;
};

export type SiteCatalogListingsByCodesQueryVariables = Exact<{
  codes: Array<string> | string;
  currencyCode: string;
  filters?: Array<FilterInput> | FilterInput | null | undefined;
}>;

export type SiteCatalogListingsByCodesQuery = {
  siteCatalogListingsByCodes: Array<{
    id: string;
    code: string;
    name: string;
    price: { currency: string; value: string };
  }>;
};

export type StartCheckoutFromCartMutationVariables = Exact<{
  input: StartCheckoutInput;
}>;

export type StartCheckoutFromCartMutation = {
  startCheckoutFromCart: {
    order: { id: string; orderNumber: string; total: { currency: string; value: string } };
    paymentIntent: {
      id: string;
      status: PaymentIntentStatus;
      description: string | null;
      paidAt: string | null;
      expiresAt: string | null;
      createdAt: string;
      amount: { currency: string; value: string };
      reference: { type: string; id: string };
      checkout: { gateway: string; payload: string; callbackPath: string | null; cancelPath: string | null } | null;
      failure: { code: string | null; message: string | null } | null;
    };
  };
};

export type SiteOfferingVariantsQueryVariables = Exact<{
  search?: string | null | undefined;
  excludeIds?: Array<string | number> | string | number | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
}>;

export type SiteOfferingVariantsQuery = {
  siteOfferingVariants: { total: number; items: Array<{ id: string; code: string; name: string }> };
};

export type SendWhatsappOtpMutationVariables = Exact<{
  input: SendWhatsappOtpInput;
}>;

export type SendWhatsappOtpMutation = {
  sendWhatsappOtp: { sent: boolean; expiresAt: string; resendAvailableAt: string; codeLength: number };
};

export type VerifyWhatsappOtpMutationVariables = Exact<{
  input: VerifyWhatsappOtpInput;
}>;

export type VerifyWhatsappOtpMutation = { verifyWhatsappOtp: { verified: boolean } };

export type SendSmsOtpMutationVariables = Exact<{
  input: SendSmsOtpInput;
}>;

export type SendSmsOtpMutation = {
  sendSmsOtp: { sent: boolean; expiresAt: string; resendAvailableAt: string; codeLength: number };
};

export type VerifySmsOtpMutationVariables = Exact<{
  input: VerifySmsOtpInput;
}>;

export type VerifySmsOtpMutation = { verifySmsOtp: { verified: boolean } };

export type PaymentIntentFieldsFragment = {
  id: string;
  status: PaymentIntentStatus;
  description: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  amount: { currency: string; value: string };
  reference: { type: string; id: string };
  checkout: { gateway: string; payload: string; callbackPath: string | null; cancelPath: string | null } | null;
  failure: { code: string | null; message: string | null } | null;
};

export type CreatePaymentIntentMutationVariables = Exact<{
  input: CreatePaymentIntentInput;
}>;

export type CreatePaymentIntentMutation = {
  createPaymentIntent: {
    id: string;
    status: PaymentIntentStatus;
    description: string | null;
    paidAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    amount: { currency: string; value: string };
    reference: { type: string; id: string };
    checkout: { gateway: string; payload: string; callbackPath: string | null; cancelPath: string | null } | null;
    failure: { code: string | null; message: string | null } | null;
  };
};

export type ConfirmPaymentMutationVariables = Exact<{
  input: ConfirmPaymentInput;
}>;

export type ConfirmPaymentMutation = {
  confirmPayment: {
    id: string;
    status: PaymentIntentStatus;
    description: string | null;
    paidAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    amount: { currency: string; value: string };
    reference: { type: string; id: string };
    checkout: { gateway: string; payload: string; callbackPath: string | null; cancelPath: string | null } | null;
    failure: { code: string | null; message: string | null } | null;
  };
};

export type PaymentIntentQueryVariables = Exact<{
  input: PaymentIntentRefInput;
}>;

export type PaymentIntentQuery = {
  paymentIntent: {
    id: string;
    status: PaymentIntentStatus;
    description: string | null;
    paidAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    amount: { currency: string; value: string };
    reference: { type: string; id: string };
    checkout: { gateway: string; payload: string; callbackPath: string | null; cancelPath: string | null } | null;
    failure: { code: string | null; message: string | null } | null;
  };
};

export type CancelPaymentIntentMutationVariables = Exact<{
  input: PaymentIntentRefInput;
}>;

export type CancelPaymentIntentMutation = {
  cancelPaymentIntent: {
    id: string;
    status: PaymentIntentStatus;
    description: string | null;
    paidAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    amount: { currency: string; value: string };
    reference: { type: string; id: string };
    checkout: { gateway: string; payload: string; callbackPath: string | null; cancelPath: string | null } | null;
    failure: { code: string | null; message: string | null } | null;
  };
};

export type PersonFieldsFragment = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

export type PersonCommunicationFieldsFragment = {
  id: string;
  channel: string;
  value: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type PeopleByCommunicationQueryVariables = Exact<{
  input: FindPeopleByCommunicationInput;
}>;

export type PeopleByCommunicationQuery = {
  peopleByCommunication: Array<{
    id: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
  }>;
};

export type CreatePersonMutationVariables = Exact<{
  input: CreatePersonInput;
}>;

export type CreatePersonMutation = {
  createPerson: {
    id: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
  };
};

export type AddPersonCommunicationMutationVariables = Exact<{
  input: AddPersonCommunicationInput;
}>;

export type AddPersonCommunicationMutation = {
  addPersonCommunication: { id: string; channel: string; value: string; isPrimary: boolean; isActive: boolean };
};

export type WishlistItemFieldsFragment = {
  id: string;
  catalogListingId: string | null;
  name: string;
  code: string;
  isAvailable: boolean;
  createdAt: string;
  price: { currency: string; value: string } | null;
};

export type WishlistQueryVariables = Exact<{
  input: WishlistQueryInput;
}>;

export type WishlistQuery = {
  wishlist: Array<{
    id: string;
    catalogListingId: string | null;
    name: string;
    code: string;
    isAvailable: boolean;
    createdAt: string;
    price: { currency: string; value: string } | null;
  }>;
};

export type AddToWishlistMutationVariables = Exact<{
  input: WishlistRefInput;
}>;

export type AddToWishlistMutation = {
  addToWishlist: {
    alreadyExists: boolean;
    wishlist: Array<{
      id: string;
      catalogListingId: string | null;
      name: string;
      code: string;
      isAvailable: boolean;
      createdAt: string;
      price: { currency: string; value: string } | null;
    }>;
  };
};

export type RemoveFromWishlistMutationVariables = Exact<{
  input: WishlistRefInput;
}>;

export type RemoveFromWishlistMutation = {
  removeFromWishlist: Array<{
    id: string;
    catalogListingId: string | null;
    name: string;
    code: string;
    isAvailable: boolean;
    createdAt: string;
    price: { currency: string; value: string } | null;
  }>;
};

export type WishlistCodesQueryVariables = Exact<{ [key: string]: never }>;

export type WishlistCodesQuery = { wishlistCodes: Array<string> };

export type PartyProfileFieldsFragment = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

export type PartyProfileQueryVariables = Exact<{ [key: string]: never }>;

export type PartyProfileQuery = {
  partyProfile: {
    id: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
};

export type UpdatePartyProfileMutationVariables = Exact<{
  input: UpdatePartyProfileInput;
}>;

export type UpdatePartyProfileMutation = {
  updatePartyProfile: {
    id: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
};

export type PartyAddressFieldsFragment = {
  id: string;
  line1: string;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  isDefault: boolean;
};

export type PartyAddressesQueryVariables = Exact<{ [key: string]: never }>;

export type PartyAddressesQuery = {
  partyAddresses: Array<{
    id: string;
    line1: string;
    line2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    countryCode: string;
    isDefault: boolean;
  }>;
};

export type AddPartyAddressMutationVariables = Exact<{
  input: PartyAddressInput;
}>;

export type AddPartyAddressMutation = {
  addPartyAddress: Array<{
    id: string;
    line1: string;
    line2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    countryCode: string;
    isDefault: boolean;
  }>;
};

export type UpdatePartyAddressMutationVariables = Exact<{
  input: UpdatePartyAddressInput;
}>;

export type UpdatePartyAddressMutation = {
  updatePartyAddress: Array<{
    id: string;
    line1: string;
    line2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    countryCode: string;
    isDefault: boolean;
  }>;
};

export type RemovePartyAddressMutationVariables = Exact<{
  input: PartyAddressRefInput;
}>;

export type RemovePartyAddressMutation = {
  removePartyAddress: Array<{
    id: string;
    line1: string;
    line2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    countryCode: string;
    isDefault: boolean;
  }>;
};

export type AppSitesQueryVariables = Exact<{
  types?: Array<AppSiteType> | AppSiteType | null | undefined;
}>;

export type AppSitesQuery = {
  appSites: Array<{
    id: string;
    code: string;
    name: string;
    type: AppSiteType;
    timezone: string;
    legalEntityId: string;
    currencyCode: string;
    sortOrder: number;
  }>;
};

export type AppLegalEntitiesQueryVariables = Exact<{ [key: string]: never }>;

export type AppLegalEntitiesQuery = {
  appLegalEntities: Array<{
    id: string;
    code: string;
    name: string;
    currencyCode: string;
    country: string;
    sortOrder: number;
  }>;
};

export const MoneyFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<MoneyFieldsFragment, unknown>;
export const CartFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CartFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Cart' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currencyCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subtotal' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'items' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'unitPrice' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lineTotal' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CartFieldsFragment, unknown>;
export const ListingFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ListingFieldsFragment, unknown>;
export const PaymentIntentFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PaymentIntentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PaymentIntent' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'amount' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reference' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'checkout' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'gateway' } },
                { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
                { kind: 'Field', name: { kind: 'Name', value: 'callbackPath' } },
                { kind: 'Field', name: { kind: 'Name', value: 'cancelPath' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'failure' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PaymentIntentFieldsFragment, unknown>;
export const PersonFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PersonFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Person' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PersonFieldsFragment, unknown>;
export const PersonCommunicationFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PersonCommunicationFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PersonCommunication' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'channel' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isPrimary' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PersonCommunicationFieldsFragment, unknown>;
export const WishlistItemFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WishlistItemFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WishlistItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<WishlistItemFieldsFragment, unknown>;
export const PartyProfileFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PartyProfileFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Person' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PartyProfileFieldsFragment, unknown>;
export const PartyAddressFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PartyAddressFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PartyAddress' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line1' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line2' } },
          { kind: 'Field', name: { kind: 'Name', value: 'city' } },
          { kind: 'Field', name: { kind: 'Name', value: 'region' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postalCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'countryCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDefault' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PartyAddressFieldsFragment, unknown>;
export const CartDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Cart' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'CartScopeInput' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'cart' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'CartFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CartFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Cart' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currencyCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subtotal' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'items' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'unitPrice' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lineTotal' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CartQuery, CartQueryVariables>;
export const AddToCartDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddToCart' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'AddCartItemInput' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addToCart' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'CartFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CartFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Cart' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currencyCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subtotal' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'items' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'unitPrice' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lineTotal' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddToCartMutation, AddToCartMutationVariables>;
export const UpdateCartItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateCartItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdateCartItemInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateCartItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'CartFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CartFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Cart' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currencyCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subtotal' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'items' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'unitPrice' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lineTotal' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateCartItemMutation, UpdateCartItemMutationVariables>;
export const RemoveFromCartDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveFromCart' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'CartItemRefInput' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removeFromCart' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'CartFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CartFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Cart' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currencyCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subtotal' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'items' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'unitPrice' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lineTotal' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RemoveFromCartMutation, RemoveFromCartMutationVariables>;
export const ClearCartDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ClearCart' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'CartScopeInput' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'clearCart' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'CartFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'CartFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Cart' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currencyCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'itemCount' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'subtotal' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'items' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'unitPrice' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lineTotal' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ClearCartMutation, ClearCartMutationVariables>;
export const CartQuantitiesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CartQuantities' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'cartQuantities' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CartQuantitiesQuery, CartQuantitiesQueryVariables>;
export const CatalogCurrenciesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CatalogCurrencies' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'catalogCurrencies' } }],
      },
    },
  ],
} as unknown as DocumentNode<CatalogCurrenciesQuery, CatalogCurrenciesQueryVariables>;
export const LeCatalogCurrenciesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'LeCatalogCurrencies' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'leCatalogCurrencies' } }],
      },
    },
  ],
} as unknown as DocumentNode<LeCatalogCurrenciesQuery, LeCatalogCurrenciesQueryVariables>;
export const SiteCatalogCurrenciesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SiteCatalogCurrencies' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'siteCatalogCurrencies' } }],
      },
    },
  ],
} as unknown as DocumentNode<SiteCatalogCurrenciesQuery, SiteCatalogCurrenciesQueryVariables>;
export const CatalogListingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CatalogListings' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
          type: {
            kind: 'ListType',
            type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'FilterInput' } } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'perPage' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sort' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ListingSort' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'catalogListings' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filters' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'perPage' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'perPage' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sort' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sort' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                { kind: 'Field', name: { kind: 'Name', value: 'page' } },
                { kind: 'Field', name: { kind: 'Name', value: 'perPage' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'filters' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sortOrder' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'values' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'count' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogListingsQuery, CatalogListingsQueryVariables>;
export const CatalogListingByCodeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CatalogListingByCode' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'code' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'catalogListingByCode' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'code' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'code' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'listing' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'axes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sortOrder' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'options' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'selected' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'variantCode' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogListingByCodeQuery, CatalogListingByCodeQueryVariables>;
export const CatalogListingsByCodesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CatalogListingsByCodes' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'codes' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
          type: {
            kind: 'ListType',
            type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'FilterInput' } } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'catalogListingsByCodes' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'codes' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'codes' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filters' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CatalogListingsByCodesQuery, CatalogListingsByCodesQueryVariables>;
export const LeCatalogListingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'LeCatalogListings' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
          type: {
            kind: 'ListType',
            type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'FilterInput' } } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'perPage' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sort' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ListingSort' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'leCatalogListings' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filters' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'perPage' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'perPage' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sort' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sort' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                { kind: 'Field', name: { kind: 'Name', value: 'page' } },
                { kind: 'Field', name: { kind: 'Name', value: 'perPage' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'filters' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sortOrder' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'values' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'count' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LeCatalogListingsQuery, LeCatalogListingsQueryVariables>;
export const LeCatalogListingByCodeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'LeCatalogListingByCode' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'code' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'leCatalogListingByCode' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'code' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'code' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'listing' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'axes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sortOrder' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'options' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'selected' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'variantCode' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LeCatalogListingByCodeQuery, LeCatalogListingByCodeQueryVariables>;
export const LeCatalogListingsByCodesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'LeCatalogListingsByCodes' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'codes' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
          type: {
            kind: 'ListType',
            type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'FilterInput' } } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'leCatalogListingsByCodes' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'codes' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'codes' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filters' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<LeCatalogListingsByCodesQuery, LeCatalogListingsByCodesQueryVariables>;
export const SiteCatalogListingsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SiteCatalogListings' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
          type: {
            kind: 'ListType',
            type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'FilterInput' } } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'perPage' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sort' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'ListingSort' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'siteCatalogListings' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filters' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'perPage' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'perPage' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'sort' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'sort' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                { kind: 'Field', name: { kind: 'Name', value: 'page' } },
                { kind: 'Field', name: { kind: 'Name', value: 'perPage' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'filters' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sortOrder' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'values' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'count' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SiteCatalogListingsQuery, SiteCatalogListingsQueryVariables>;
export const SiteCatalogListingByCodeDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SiteCatalogListingByCode' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'code' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'siteCatalogListingByCode' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'code' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'code' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'listing' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'axes' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sortOrder' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'options' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'selected' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'variantCode' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SiteCatalogListingByCodeQuery, SiteCatalogListingByCodeQueryVariables>;
export const SiteCatalogListingsByCodesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SiteCatalogListingsByCodes' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'codes' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
          type: {
            kind: 'ListType',
            type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'FilterInput' } } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'siteCatalogListingsByCodes' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'codes' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'codes' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'currencyCode' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'currencyCode' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filters' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'filters' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'ListingFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'ListingFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CatalogListing' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SiteCatalogListingsByCodesQuery, SiteCatalogListingsByCodesQueryVariables>;
export const StartCheckoutFromCartDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'StartCheckoutFromCart' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'StartCheckoutInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'startCheckoutFromCart' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'order' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'orderNumber' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'total' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'paymentIntent' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PaymentIntentFields' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PaymentIntentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PaymentIntent' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'amount' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reference' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'checkout' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'gateway' } },
                { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
                { kind: 'Field', name: { kind: 'Name', value: 'callbackPath' } },
                { kind: 'Field', name: { kind: 'Name', value: 'cancelPath' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'failure' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<StartCheckoutFromCartMutation, StartCheckoutFromCartMutationVariables>;
export const SiteOfferingVariantsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SiteOfferingVariants' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'excludeIds' } },
          type: {
            kind: 'ListType',
            type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'siteOfferingVariants' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'search' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'search' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'excludeIds' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'excludeIds' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'offset' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SiteOfferingVariantsQuery, SiteOfferingVariantsQueryVariables>;
export const SendWhatsappOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendWhatsappOtp' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'SendWhatsappOtpInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sendWhatsappOtp' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'sent' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'resendAvailableAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'codeLength' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SendWhatsappOtpMutation, SendWhatsappOtpMutationVariables>;
export const VerifyWhatsappOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'VerifyWhatsappOtp' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'VerifyWhatsappOtpInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'verifyWhatsappOtp' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'verified' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<VerifyWhatsappOtpMutation, VerifyWhatsappOtpMutationVariables>;
export const SendSmsOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'SendSmsOtp' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'SendSmsOtpInput' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'sendSmsOtp' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'sent' } },
                { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'resendAvailableAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'codeLength' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SendSmsOtpMutation, SendSmsOtpMutationVariables>;
export const VerifySmsOtpDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'VerifySmsOtp' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'VerifySmsOtpInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'verifySmsOtp' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'verified' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<VerifySmsOtpMutation, VerifySmsOtpMutationVariables>;
export const CreatePaymentIntentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreatePaymentIntent' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreatePaymentIntentInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createPaymentIntent' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PaymentIntentFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PaymentIntentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PaymentIntent' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'amount' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reference' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'checkout' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'gateway' } },
                { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
                { kind: 'Field', name: { kind: 'Name', value: 'callbackPath' } },
                { kind: 'Field', name: { kind: 'Name', value: 'cancelPath' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'failure' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreatePaymentIntentMutation, CreatePaymentIntentMutationVariables>;
export const ConfirmPaymentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'ConfirmPayment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ConfirmPaymentInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'confirmPayment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PaymentIntentFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PaymentIntentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PaymentIntent' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'amount' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reference' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'checkout' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'gateway' } },
                { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
                { kind: 'Field', name: { kind: 'Name', value: 'callbackPath' } },
                { kind: 'Field', name: { kind: 'Name', value: 'cancelPath' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'failure' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ConfirmPaymentMutation, ConfirmPaymentMutationVariables>;
export const PaymentIntentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PaymentIntent' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PaymentIntentRefInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'paymentIntent' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PaymentIntentFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PaymentIntentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PaymentIntent' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'amount' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reference' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'checkout' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'gateway' } },
                { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
                { kind: 'Field', name: { kind: 'Name', value: 'callbackPath' } },
                { kind: 'Field', name: { kind: 'Name', value: 'cancelPath' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'failure' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PaymentIntentQuery, PaymentIntentQueryVariables>;
export const CancelPaymentIntentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CancelPaymentIntent' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PaymentIntentRefInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'cancelPaymentIntent' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PaymentIntentFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PaymentIntentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PaymentIntent' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'amount' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'reference' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'description' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'checkout' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'gateway' } },
                { kind: 'Field', name: { kind: 'Name', value: 'payload' } },
                { kind: 'Field', name: { kind: 'Name', value: 'callbackPath' } },
                { kind: 'Field', name: { kind: 'Name', value: 'cancelPath' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'failure' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'message' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'paidAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CancelPaymentIntentMutation, CancelPaymentIntentMutationVariables>;
export const PeopleByCommunicationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PeopleByCommunication' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'FindPeopleByCommunicationInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'peopleByCommunication' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PersonFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PersonFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Person' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PeopleByCommunicationQuery, PeopleByCommunicationQueryVariables>;
export const CreatePersonDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreatePerson' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreatePersonInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createPerson' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PersonFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PersonFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Person' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreatePersonMutation, CreatePersonMutationVariables>;
export const AddPersonCommunicationDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddPersonCommunication' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'AddPersonCommunicationInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addPersonCommunication' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PersonCommunicationFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PersonCommunicationFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PersonCommunication' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'channel' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isPrimary' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isActive' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddPersonCommunicationMutation, AddPersonCommunicationMutationVariables>;
export const WishlistDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Wishlist' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'WishlistQueryInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'wishlist' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'WishlistItemFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WishlistItemFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WishlistItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<WishlistQuery, WishlistQueryVariables>;
export const AddToWishlistDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddToWishlist' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'WishlistRefInput' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addToWishlist' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'alreadyExists' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'wishlist' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'WishlistItemFields' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WishlistItemFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WishlistItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddToWishlistMutation, AddToWishlistMutationVariables>;
export const RemoveFromWishlistDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveFromWishlist' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'WishlistRefInput' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removeFromWishlist' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'WishlistItemFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'MoneyFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Money' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'currency' } },
          { kind: 'Field', name: { kind: 'Name', value: 'value' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'WishlistItemFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'WishlistItem' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'catalogListingId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
          { kind: 'Field', name: { kind: 'Name', value: 'code' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isAvailable' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'price' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'MoneyFields' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RemoveFromWishlistMutation, RemoveFromWishlistMutationVariables>;
export const WishlistCodesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'WishlistCodes' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{ kind: 'Field', name: { kind: 'Name', value: 'wishlistCodes' } }],
      },
    },
  ],
} as unknown as DocumentNode<WishlistCodesQuery, WishlistCodesQueryVariables>;
export const PartyProfileDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PartyProfile' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'partyProfile' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PartyProfileFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PartyProfileFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Person' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PartyProfileQuery, PartyProfileQueryVariables>;
export const UpdatePartyProfileDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePartyProfile' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdatePartyProfileInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePartyProfile' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PartyProfileFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PartyProfileFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Person' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'firstName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lastName' } },
          { kind: 'Field', name: { kind: 'Name', value: 'email' } },
          { kind: 'Field', name: { kind: 'Name', value: 'phone' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdatePartyProfileMutation, UpdatePartyProfileMutationVariables>;
export const PartyAddressesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'PartyAddresses' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'partyAddresses' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PartyAddressFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PartyAddressFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PartyAddress' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line1' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line2' } },
          { kind: 'Field', name: { kind: 'Name', value: 'city' } },
          { kind: 'Field', name: { kind: 'Name', value: 'region' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postalCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'countryCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDefault' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<PartyAddressesQuery, PartyAddressesQueryVariables>;
export const AddPartyAddressDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddPartyAddress' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PartyAddressInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addPartyAddress' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PartyAddressFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PartyAddressFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PartyAddress' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line1' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line2' } },
          { kind: 'Field', name: { kind: 'Name', value: 'city' } },
          { kind: 'Field', name: { kind: 'Name', value: 'region' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postalCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'countryCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDefault' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddPartyAddressMutation, AddPartyAddressMutationVariables>;
export const UpdatePartyAddressDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdatePartyAddress' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'UpdatePartyAddressInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updatePartyAddress' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PartyAddressFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PartyAddressFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PartyAddress' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line1' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line2' } },
          { kind: 'Field', name: { kind: 'Name', value: 'city' } },
          { kind: 'Field', name: { kind: 'Name', value: 'region' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postalCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'countryCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDefault' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdatePartyAddressMutation, UpdatePartyAddressMutationVariables>;
export const RemovePartyAddressDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemovePartyAddress' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'PartyAddressRefInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removePartyAddress' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'PartyAddressFields' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'PartyAddressFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'PartyAddress' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line1' } },
          { kind: 'Field', name: { kind: 'Name', value: 'line2' } },
          { kind: 'Field', name: { kind: 'Name', value: 'city' } },
          { kind: 'Field', name: { kind: 'Name', value: 'region' } },
          { kind: 'Field', name: { kind: 'Name', value: 'postalCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'countryCode' } },
          { kind: 'Field', name: { kind: 'Name', value: 'isDefault' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RemovePartyAddressMutation, RemovePartyAddressMutationVariables>;
export const AppSitesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AppSites' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'types' } },
          type: {
            kind: 'ListType',
            type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'AppSiteType' } } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'appSites' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'types' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'types' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                { kind: 'Field', name: { kind: 'Name', value: 'timezone' } },
                { kind: 'Field', name: { kind: 'Name', value: 'legalEntityId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'currencyCode' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sortOrder' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AppSitesQuery, AppSitesQueryVariables>;
export const AppLegalEntitiesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AppLegalEntities' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'appLegalEntities' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'currencyCode' } },
                { kind: 'Field', name: { kind: 'Name', value: 'country' } },
                { kind: 'Field', name: { kind: 'Name', value: 'sortOrder' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AppLegalEntitiesQuery, AppLegalEntitiesQueryVariables>;
