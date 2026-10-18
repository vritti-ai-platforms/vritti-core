import { SITE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import type { CatalogsBinding } from '@/components/catalogs/bindings';
import { useCatalogChannelsForCatalog } from '@/hooks/site/catalog-channels';
import {
  CATALOG_CURRENCY_LISTINGS_TABLE_KEY,
  CATALOG_LISTINGS_TABLE_KEY,
  CATALOGS_TABLE_KEY,
  useAddCatalogCurrency,
  useAddCatalogListings,
  useBulkRemoveCatalogListings,
  useBulkSetCatalogListingAvailability,
  useBulkSetCatalogListingPrice,
  useCatalog,
  useCatalogCurrencies,
  useCatalogCurrencyListingsTable,
  useCatalogListingsTable,
  useCatalogsTable,
  useClearCatalogListingPrice,
  useCreateCatalog,
  useDeleteCatalog,
  useDeleteCatalogListing,
  useRemoveCatalogCurrency,
  useSetCatalogListingChannelVisibility,
  useSetCatalogListingPrice,
  useUpdateCatalog,
} from '@/hooks/site/catalogs';

export const siteCatalogsBinding: CatalogsBinding = {
  permissions: SITE_CATALOGS,
  listDescription:
    'Price lists this outlet quotes from — its own items plus whatever the company and organization offer.',
  tableKey: CATALOGS_TABLE_KEY,
  listingsTableKey: CATALOG_LISTINGS_TABLE_KEY,
  currencyListingsTableKey: CATALOG_CURRENCY_LISTINGS_TABLE_KEY,
  tableSlug: 'commerce-site-catalogs',
  listingsTableSlug: (catalogId) => `commerce-site-catalog-${catalogId}-items`,
  pricesTableSlug: (catalogId) => `commerce-site-catalog-${catalogId}-prices`,

  useCatalogsTable,
  useCatalog,
  useCreateCatalog,
  useUpdateCatalog,
  useDeleteCatalog,

  useListingsTable: useCatalogListingsTable,
  useAddListings: useAddCatalogListings,
  useDeleteListing: useDeleteCatalogListing,
  useSetListingPrice: useSetCatalogListingPrice,
  useSetListingChannelVisibility: useSetCatalogListingChannelVisibility,
  useClearListingPrice: useClearCatalogListingPrice,

  useBulkRemoveListings: useBulkRemoveCatalogListings,
  useBulkSetListingPrice: useBulkSetCatalogListingPrice,
  useBulkSetListingAvailability: useBulkSetCatalogListingAvailability,

  useCurrencies: useCatalogCurrencies,
  useCurrencyListingsTable: useCatalogCurrencyListingsTable,
  useAddCurrency: useAddCatalogCurrency,
  useRemoveCurrency: useRemoveCatalogCurrency,

  useChannelsForCatalog: useCatalogChannelsForCatalog,
};
