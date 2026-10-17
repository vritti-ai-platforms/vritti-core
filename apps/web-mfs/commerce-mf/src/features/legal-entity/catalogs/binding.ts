import { LE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import type { CatalogsBinding } from '@/components/catalogs/bindings';
import { useCatalogChannelsForCatalog } from '@/hooks/legal-entity/catalog-channels';
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
} from '@/hooks/legal-entity/catalogs';

export const leCatalogsBinding: CatalogsBinding = {
  permissions: LE_CATALOGS,
  listDescription: 'Price lists this company quotes from — its own items plus whatever the organization offers.',
  tableKey: CATALOGS_TABLE_KEY,
  listingsTableKey: CATALOG_LISTINGS_TABLE_KEY,
  currencyListingsTableKey: CATALOG_CURRENCY_LISTINGS_TABLE_KEY,
  tableSlug: 'commerce-le-catalogs',
  listingsTableSlug: (catalogId) => `commerce-le-catalog-${catalogId}-items`,
  pricesTableSlug: (catalogId) => `commerce-le-catalog-${catalogId}-prices`,

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
