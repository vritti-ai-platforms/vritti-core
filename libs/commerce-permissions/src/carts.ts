// Cart permission codes — MUST match the cloud catalog's authored codes exactly.
//
// Site-scoped, not org: a basket is an act at an outlet. It becomes an order that site fulfils and
// its lines are priced the way that site sells, so the right to see or change one is the right to
// work at that outlet — which is also what lets a site's staff be given baskets without being given
// every other outlet's.
//
// The same codes serve the web screens and the storefront's GraphQL surface; which may claim them is
// the catalog's per-platform flags, and a plan entitles the two independently.
export const SITE_CARTS = {
  featureCode: 'carts',
  view: 'site.carts.view',
  add: 'site.carts.add',
  edit: 'site.carts.edit',
  delete: 'site.carts.delete',
} as const;

// The same basket, from the company above the outlet.
//
// An LE workspace sees what its sites own — that is `workspaceHierarchyPolicies` reading downward —
// which is how invoicing at the company reaches a basket filled at a till. It also owns baskets of
// its own: a sale agreed at the company, not at any one outlet.
export const LE_CARTS = {
  featureCode: 'carts',
  view: 'le.carts.view',
  add: 'le.carts.add',
  edit: 'le.carts.edit',
  delete: 'le.carts.delete',
} as const;
