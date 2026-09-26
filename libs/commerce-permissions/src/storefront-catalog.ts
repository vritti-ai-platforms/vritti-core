// Storefront catalog permission codes — MUST match the cloud catalog's authored codes exactly.
//
// What a provisioned website may read of its own range: the listings its APP channel resolves to,
// so its CMS can file a page against a real, sellable item rather than a hand-typed id.
//
// Read only, and deliberately so. A storefront lists what it was given; adding to or pricing the
// catalogue is staff work and belongs to the session-authenticated surface.
export const ORG_STOREFRONT_CATALOG = {
  featureCode: 'storefront-catalog',
  view: 'org.storefront-catalog.view',
} as const;
