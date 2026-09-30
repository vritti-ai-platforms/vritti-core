import { SITE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import type { CatalogsBinding } from '@/components/catalogs/bindings';
import { useCatalogChannelsForCatalog } from '@/hooks/site/catalog-channels';
import {
  CATALOG_LISTINGS_TABLE_KEY,
  CATALOGS_TABLE_KEY,
  useAddCatalogListing,
  useCatalog,
  useCatalogListingMrpOptions,
  useCatalogListingsTable,
  useCatalogsTable,
  useCreateCatalog,
  useDeleteCatalog,
  useDeleteCatalogListing,
  useSetCatalogListingChannelVisibility,
  useSetCatalogListingPrice,
  useUpdateCatalog,
} from '@/hooks/site/catalogs';

export const siteCatalogsBinding: CatalogsBinding = {
  permissions: SITE_CATALOGS,
  listDescription:
    'Price lists this outlet sells from — its own items plus whatever the company and organization offer.',
  tableKey: CATALOGS_TABLE_KEY,
  listingsTableKey: CATALOG_LISTINGS_TABLE_KEY,
  tableSlug: 'commerce-site-catalogs',
  listingsTableSlug: (catalogId) => `commerce-site-catalog-${catalogId}-items`,

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

  useChannelsForCatalog: useCatalogChannelsForCatalog,
};
