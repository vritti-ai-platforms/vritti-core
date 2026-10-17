// Catalogs permission codes — MUST match the cloud catalog's authored codes exactly.
// Listing membership and pricing are separate acts on purpose: deciding what a catalog carries is
// merchandising, deciding what it charges is commercial, and the two are rarely the same person.
// One object per workspace scope. Every scope owns the catalogs it creates and adds items from
// whatever it can reach, so all three carry the same surface — reach is bounded by row ownership
// (RLS), not by the permission set.
export const ORG_CATALOGS = {
  featureCode: 'catalogs',
  view: 'org.catalogs.view',
  add: 'org.catalogs.add',
  edit: 'org.catalogs.edit',
  delete: 'org.catalogs.delete',
  // What the catalog may be priced in. Three acts, not one: offering a currency commits the catalog
  // to quoting in it, and withdrawing one is refused while it still prices anything — neither is the
  // same decision as reading the list.
  currencies: {
    view: 'org.catalogs.currencies.view',
    add: 'org.catalogs.currencies.add',
    delete: 'org.catalogs.currencies.delete',
  },
  // Setting a price and clearing one are separate acts: clearing drops this workspace's own row and
  // lets whatever a wider one charges apply again, which is a different decision from naming a number.
  prices: {
    view: 'org.catalogs.prices.view',
    set: 'org.catalogs.prices.set',
    clear: 'org.catalogs.prices.clear',
  },
  listings: {
    view: 'org.catalogs.listings.view',
    add: 'org.catalogs.listings.add',
    edit: 'org.catalogs.listings.edit',
    delete: 'org.catalogs.listings.delete',
  },
} as const;

export const LE_CATALOGS = {
  featureCode: 'catalogs',
  view: 'le.catalogs.view',
  add: 'le.catalogs.add',
  edit: 'le.catalogs.edit',
  delete: 'le.catalogs.delete',
  // What the catalog may be priced in. Three acts, not one: offering a currency commits the catalog
  // to quoting in it, and withdrawing one is refused while it still prices anything — neither is the
  // same decision as reading the list.
  currencies: {
    view: 'le.catalogs.currencies.view',
    add: 'le.catalogs.currencies.add',
    delete: 'le.catalogs.currencies.delete',
  },
  // Setting a price and clearing one are separate acts: clearing drops this workspace's own row and
  // lets whatever a wider one charges apply again, which is a different decision from naming a number.
  prices: {
    view: 'le.catalogs.prices.view',
    set: 'le.catalogs.prices.set',
    clear: 'le.catalogs.prices.clear',
  },
  listings: {
    view: 'le.catalogs.listings.view',
    add: 'le.catalogs.listings.add',
    edit: 'le.catalogs.listings.edit',
    delete: 'le.catalogs.listings.delete',
  },
} as const;

export const SITE_CATALOGS = {
  featureCode: 'catalogs',
  view: 'site.catalogs.view',
  add: 'site.catalogs.add',
  edit: 'site.catalogs.edit',
  delete: 'site.catalogs.delete',
  // What the catalog may be priced in. Three acts, not one: offering a currency commits the catalog
  // to quoting in it, and withdrawing one is refused while it still prices anything — neither is the
  // same decision as reading the list.
  currencies: {
    view: 'site.catalogs.currencies.view',
    add: 'site.catalogs.currencies.add',
    delete: 'site.catalogs.currencies.delete',
  },
  // Setting a price and clearing one are separate acts: clearing drops this workspace's own row and
  // lets whatever a wider one charges apply again, which is a different decision from naming a number.
  prices: {
    view: 'site.catalogs.prices.view',
    set: 'site.catalogs.prices.set',
    clear: 'site.catalogs.prices.clear',
  },
  listings: {
    view: 'site.catalogs.listings.view',
    add: 'site.catalogs.listings.add',
    edit: 'site.catalogs.listings.edit',
    delete: 'site.catalogs.listings.delete',
  },
} as const;
