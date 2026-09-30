import { LE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import type { CatalogsBinding } from '@/components/catalogs/bindings';
import { useCatalogChannelsForCatalog } from '@/hooks/legal-entity/catalog-channels';
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
} from '@/hooks/legal-entity/catalogs';

export const leCatalogsBinding: CatalogsBinding = {
  permissions: LE_CATALOGS,
  listDescription: 'Price lists this company sells from — its own items plus whatever the organization offers.',
  tableKey: CATALOGS_TABLE_KEY,
  listingsTableKey: CATALOG_LISTINGS_TABLE_KEY,
  tableSlug: 'commerce-le-catalogs',
  listingsTableSlug: (catalogId) => `commerce-le-catalog-${catalogId}-items`,

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
