// Catalog channel permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope. Every scope sees the same three channel types and may assign a
// catalog to each; what differs is whose assignment it is, which RLS decides by row ownership.
export const ORG_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'org.catalog-channels.view',
  edit: 'org.catalog-channels.edit',
  // What a storefront credential may read through its own channel. POS and B2B get their own
  // groups when those surfaces exist.
  app: {
    listings: 'org.catalog-channels.app.listings',
    listing: 'org.catalog-channels.app.listing',
    listingsFromVariants: 'org.catalog-channels.app.listings-from-variants',
  },
} as const;

export const LE_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'le.catalog-channels.view',
  edit: 'le.catalog-channels.edit',
  app: {
    listings: 'le.catalog-channels.app.listings',
    listing: 'le.catalog-channels.app.listing',
    listingsFromVariants: 'le.catalog-channels.app.listings-from-variants',
  },
} as const;

export const SITE_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'site.catalog-channels.view',
  edit: 'site.catalog-channels.edit',
  app: {
    listings: 'site.catalog-channels.app.listings',
    listing: 'site.catalog-channels.app.listing',
    listingsFromVariants: 'site.catalog-channels.app.listings-from-variants',
  },
} as const;
