// Catalog channel permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope. Every scope sees the same three channel types and may assign a
// catalog to each; what differs is whose assignment it is, which RLS decides by row ownership.
//
// `view` covers reading a channel whoever is asking: a staff member opening the channels screen and a
// storefront credential reading the resolved catalogue are the same act of reading, so they share the
// code. What separates them is the platform the permission names — `view` carries WEB and GRAPHQL, and
// the interceptor resolves a caller against the bucket its credential type implies — plus the guard
// itself, which admits a session to the controller and a credential to the resolver.
//
// An earlier revision had an `app` sub-group (`app.listings`, `app.listings-from-variants`) for the
// credential-facing reads. It bought nothing: a credential holds one composed permission set, so the
// split only created ways to grant half of one feature.
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
