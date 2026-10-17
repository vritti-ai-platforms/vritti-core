import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import type { CatalogsBinding } from '@/components/catalogs/bindings';
import { useCatalogChannelsForCatalog } from '@/hooks/organization/catalog-channels';
import {
  CATALOG_CURRENCY_LISTINGS_TABLE_KEY,
  CATALOG_LISTINGS_TABLE_KEY,
  CATALOGS_TABLE_KEY,
  useAddCatalogCurrency,
  useAddCatalogListing,
  useCatalog,
  useCatalogCurrencies,
  useCatalogCurrencyListingsTable,
  useCatalogListingMrpOptions,
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
} from '@/hooks/organization/catalogs';

export const orgCatalogsBinding: CatalogsBinding = {
  permissions: ORG_CATALOGS,
  listDescription: 'Price lists this organization quotes from. Every workspace below can add its own items.',
  tableKey: CATALOGS_TABLE_KEY,
  listingsTableKey: CATALOG_LISTINGS_TABLE_KEY,
  currencyListingsTableKey: CATALOG_CURRENCY_LISTINGS_TABLE_KEY,
  tableSlug: 'commerce-org-catalogs',
  listingsTableSlug: (catalogId) => `commerce-org-catalog-${catalogId}-items`,
  pricesTableSlug: (catalogId) => `commerce-org-catalog-${catalogId}-prices`,

  useCatalogsTable,
  useCatalog,
  useCreateCatalog,
  useUpdateCatalog,
  useDeleteCatalog,

  useListingsTable: useCatalogListingsTable,
  useListingMrpOptions: useCatalogListingMrpOptions,
  useAddListing: useAddCatalogListing,
  useDeleteListing: useDeleteCatalogListing,
  useSetListingPrice: useSetCatalogListingPrice,
  useSetListingChannelVisibility: useSetCatalogListingChannelVisibility,
  useClearListingPrice: useClearCatalogListingPrice,

  useCurrencies: useCatalogCurrencies,
  useCurrencyListingsTable: useCatalogCurrencyListingsTable,
  useAddCurrency: useAddCatalogCurrency,
  useRemoveCurrency: useRemoveCatalogCurrency,

  useChannelsForCatalog: useCatalogChannelsForCatalog,
};
