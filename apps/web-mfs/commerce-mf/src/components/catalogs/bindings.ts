import type {
  CatalogPermissions,
  UseAddCatalogCurrency,
  UseAddCatalogListings,
  UseBulkRemoveCatalogListings,
  UseBulkSetCatalogListingAvailability,
  UseBulkSetCatalogListingPrice,
  UseCatalogChannelsForCatalog,
  UseCatalogCurrencies,
  UseCatalogCurrencyListingsTable,
  UseCatalogListingsTable,
  UseCatalogsTable,
  UseClearCatalogListingPrice,
  UseCreateCatalog,
  UseDeleteCatalog,
  UseDeleteCatalogListing,
  UseRemoveCatalogCurrency,
  UseSetCatalogListingChannelVisibility,
  UseSetCatalogListingPrice,
  UseSuspenseCatalog,
  UseUpdateCatalog,
} from './types';

export interface CatalogsBinding {
  permissions: CatalogPermissions;
  listDescription: string;
  tableKey: readonly unknown[];
  listingsTableKey: (catalogId: string) => readonly unknown[];
  currencyListingsTableKey: (catalogId: string, currencyCode: string) => readonly unknown[];
  tableSlug: string;
  listingsTableSlug: (catalogId: string) => string;
  pricesTableSlug: (catalogId: string) => string;

  useCatalogsTable: UseCatalogsTable;
  useCatalog: UseSuspenseCatalog;
  useCreateCatalog: UseCreateCatalog;
  useUpdateCatalog: UseUpdateCatalog;
  useDeleteCatalog: UseDeleteCatalog;

  useListingsTable: UseCatalogListingsTable;
  useAddListings: UseAddCatalogListings;
  useDeleteListing: UseDeleteCatalogListing;
  useSetListingPrice: UseSetCatalogListingPrice;
  useSetListingChannelVisibility: UseSetCatalogListingChannelVisibility;
  useClearListingPrice: UseClearCatalogListingPrice;

  useBulkRemoveListings: UseBulkRemoveCatalogListings;
  useBulkSetListingPrice: UseBulkSetCatalogListingPrice;
  useBulkSetListingAvailability: UseBulkSetCatalogListingAvailability;

  useCurrencies: UseCatalogCurrencies;
  useCurrencyListingsTable: UseCatalogCurrencyListingsTable;
  useAddCurrency: UseAddCatalogCurrency;
  useRemoveCurrency: UseRemoveCatalogCurrency;

  useChannelsForCatalog: UseCatalogChannelsForCatalog;
}
