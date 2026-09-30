import type {
  CatalogPermissions,
  UseAddCatalogListing,
  UseCatalogChannelsForCatalog,
  UseCatalogListingMrpOptions,
  UseCatalogListingsTable,
  UseCatalogsTable,
  UseCreateCatalog,
  UseDeleteCatalog,
  UseDeleteCatalogListing,
  UseSetCatalogListingChannelVisibility,
  UseSetCatalogListingPrice,
  UseSuspenseCatalog,
  UseUpdateCatalog,
} from './types';

// One per workspace scope. The components are scope-agnostic: everything that differs — which
// permission codes gate an action, which endpoint a hook calls, which query key it caches under —
// arrives here. Reach is enforced by RLS, so the three bindings differ only in wiring.
export interface CatalogsBinding {
  permissions: CatalogPermissions;
  // Shown under the page title — the only copy that differs between scopes
  listDescription: string;
  tableKey: readonly unknown[];
  listingsTableKey: (catalogId: string) => readonly unknown[];
  // Must byte-match the gateway's getCurrentState key or the user's saved view silently resets —
  // and a scope that reuses another's slug overwrites that scope's view
  tableSlug: string;
  listingsTableSlug: (catalogId: string) => string;

  useCatalogsTable: UseCatalogsTable;
  useCatalog: UseSuspenseCatalog;
  useCreateCatalog: UseCreateCatalog;
  useUpdateCatalog: UseUpdateCatalog;
  useDeleteCatalog: UseDeleteCatalog;

  useListingsTable: UseCatalogListingsTable;
  useListingMrpOptions: UseCatalogListingMrpOptions;
  useAddListing: UseAddCatalogListing;
  useDeleteListing: UseDeleteCatalogListing;
  useSetListingPrice: UseSetCatalogListingPrice;
  useSetListingChannelVisibility: UseSetCatalogListingChannelVisibility;

  useChannelsForCatalog: UseCatalogChannelsForCatalog;
}
