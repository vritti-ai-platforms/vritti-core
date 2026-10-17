// Catalog channel permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope. Every scope sees the same three channel types and may assign a
// catalog to each; what differs is whose assignment it is, which RLS decides by row ownership.
//
// One code per act, not one per screen: `view` sees the channels and what each is assigned,
// `listings` reads a channel's resolved listings (the staff items table on WEB and a storefront
// credential's catalogue read on GRAPHQL — the same read, two surfaces), `edit` assigns a catalog,
// `visibility` includes or excludes one listing on a channel, `delete` removes an assignment.
export const ORG_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'org.catalog-channels.view',
  listings: 'org.catalog-channels.listings',
  // A channel's prices per currency, and which currencies it can quote. Staff-only: a storefront
  // credential reads currencies through `listings`, since a catalogue read it may make is useless
  // without knowing which currencies to ask in.
  prices: 'org.catalog-channels.prices',
  edit: 'org.catalog-channels.edit',
  visibility: 'org.catalog-channels.visibility',
  delete: 'org.catalog-channels.delete',
} as const;

export const LE_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'le.catalog-channels.view',
  listings: 'le.catalog-channels.listings',
  // A channel's prices per currency, and which currencies it can quote. Staff-only: a storefront
  // credential reads currencies through `listings`, since a catalogue read it may make is useless
  // without knowing which currencies to ask in.
  prices: 'le.catalog-channels.prices',
  edit: 'le.catalog-channels.edit',
  visibility: 'le.catalog-channels.visibility',
  delete: 'le.catalog-channels.delete',
} as const;

export const SITE_CATALOG_CHANNELS = {
  featureCode: 'catalog-channels',
  view: 'site.catalog-channels.view',
  listings: 'site.catalog-channels.listings',
  // A channel's prices per currency, and which currencies it can quote. Staff-only: a storefront
  // credential reads currencies through `listings`, since a catalogue read it may make is useless
  // without knowing which currencies to ask in.
  prices: 'site.catalog-channels.prices',
  edit: 'site.catalog-channels.edit',
  visibility: 'site.catalog-channels.visibility',
  delete: 'site.catalog-channels.delete',
} as const;
