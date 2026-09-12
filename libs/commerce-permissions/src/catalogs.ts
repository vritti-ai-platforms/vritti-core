// Catalogs permission codes — MUST match the cloud catalog's authored codes exactly.
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
