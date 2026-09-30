// Catalog channel permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope. Every scope sees the same three channel types and may assign a
// catalog to each; what differs is whose assignment it is, which RLS decides by row ownership.
export const ORG_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'org.catalog-channels.view',
  edit: 'org.catalog-channels.edit',
} as const;

export const LE_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'le.catalog-channels.view',
  edit: 'le.catalog-channels.edit',
} as const;

export const SITE_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'site.catalog-channels.view',
  edit: 'site.catalog-channels.edit',
} as const;
