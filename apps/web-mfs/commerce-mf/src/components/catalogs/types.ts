import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CatalogChannelData } from '@/schemas/catalog-channels';
import type {
  AddCatalogListingFormData,
  CatalogCurrencyData,
  CatalogData,
  CatalogListingData,
  CatalogListingsTableResponse,
  CatalogsTableResponse,
  SetCatalogListingPriceFormData,
} from '@/schemas/catalogs';
import type { CatalogListingMrpOption } from '@/services/organization/catalogs.service';

export interface CatalogPermissions {
  featureCode: string;
  view: string;
  add: string;
  edit: string;
  delete: string;
  currencies: { view: string; add: string; delete: string };
  prices: { view: string; set: string; clear: string };
  listings: { view: string; add: string; edit: string; delete: string };
}

type Mutation<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type AddCatalogListingPayload = AddCatalogListingFormData & { catalogId: string };
export type CreateCatalogPayload = { name: string; taxInclusive: boolean };
export type UpdateCatalogPayload = { name?: string; taxInclusive?: boolean; isActive?: boolean };
export type ListingRef = { catalogId: string; listingId: string };

export type UseCatalogsTable = (options?: { enabled?: boolean }) => {
  data: CatalogsTableResponse | undefined;
  isLoading: boolean;
};
export type UseSuspenseCatalog = (id: string) => { data: CatalogData };
export type UseCatalogListingsTable = (
  catalogId: string,
  options?: { enabled?: boolean },
) => { data: CatalogListingsTableResponse | undefined; isLoading: boolean };
export type UseCatalogListingMrpOptions = (offeringVariantId: string | undefined) => {
  data: CatalogListingMrpOption[] | undefined;
  isLoading: boolean;
};
export type UseCatalogCurrencies = (catalogId: string) => {
  data: CatalogCurrencyData[] | undefined;
  isLoading: boolean;
};
export type UseCatalogCurrencyListingsTable = (
  catalogId: string,
  currencyCode: string,
) => { data: CatalogListingsTableResponse | undefined; isLoading: boolean };
export type UseCatalogChannelsForCatalog = (catalogId: string) => {
  data: CatalogChannelData[] | undefined;
  isLoading: boolean;
};

export type UseCreateCatalog = Mutation<CreateResponse<CatalogData>, CreateCatalogPayload>;
export type UseUpdateCatalog = Mutation<SuccessResponse, { id: string; data: UpdateCatalogPayload }>;
export type UseDeleteCatalog = Mutation<SuccessResponse, string>;
export type UseAddCatalogListing = Mutation<CreateResponse<CatalogListingData>, AddCatalogListingPayload>;
export type UseDeleteCatalogListing = Mutation<SuccessResponse, ListingRef>;
export type UseSetCatalogListingPrice = Mutation<SuccessResponse, SetCatalogListingPriceFormData & ListingRef>;
export type UseClearCatalogListingPrice = Mutation<SuccessResponse, ListingRef & { currencyCode: string }>;
export type UseAddCatalogCurrency = Mutation<SuccessResponse, { catalogId: string; currencyCode: string }>;
export type UseRemoveCatalogCurrency = Mutation<SuccessResponse, { catalogId: string; currencyCode: string }>;
export type UseSetCatalogListingChannelVisibility = Mutation<
  SuccessResponse,
  ListingRef & { channelId: string; visible: boolean }
>;
