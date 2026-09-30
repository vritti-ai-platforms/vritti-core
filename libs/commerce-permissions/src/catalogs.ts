// Catalogs permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope. Every scope owns the catalogs it creates and adds items from
// whatever it can reach, so all three carry the same surface — reach is bounded by row ownership
// (RLS), not by the permission set.
export const ORG_CATALOGS = {
  featureCode: 'catalogs',
  view: 'org.catalogs.view',
  add: 'org.catalogs.add',
  edit: 'org.catalogs.edit',
  delete: 'org.catalogs.delete',
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
  listings: {
    view: 'site.catalogs.listings.view',
    add: 'site.catalogs.listings.add',
    edit: 'site.catalogs.listings.edit',
    delete: 'site.catalogs.listings.delete',
  },
} as const;
