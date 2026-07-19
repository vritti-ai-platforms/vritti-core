// Suppliers permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
export const LE_SUPPLIERS = {
  featureCode: 'suppliers',
  view: 'le.suppliers.view',
  add: 'le.suppliers.add',
  edit: 'le.suppliers.edit',
  delete: 'le.suppliers.delete',
  items: {
    view: 'le.suppliers.items.view',
    add: 'le.suppliers.items.add',
    edit: 'le.suppliers.items.edit',
    delete: 'le.suppliers.items.delete',
  },
  prices: {
    view: 'le.suppliers.prices.view',
    add: 'le.suppliers.prices.add',
    edit: 'le.suppliers.prices.edit',
    delete: 'le.suppliers.prices.delete',
  },
  sites: {
    view: 'le.suppliers.sites.view',
    add: 'le.suppliers.sites.add',
    edit: 'le.suppliers.sites.edit',
    delete: 'le.suppliers.sites.delete',
  },
} as const;

export const SITE_SUPPLIERS = {
  featureCode: 'suppliers',
  view: 'site.suppliers.view',
  add: 'site.suppliers.add',
  edit: 'site.suppliers.edit',
  delete: 'site.suppliers.delete',
  items: {
    view: 'site.suppliers.items.view',
  },
  prices: {
    view: 'site.suppliers.prices.view',
    add: 'site.suppliers.prices.add',
    edit: 'site.suppliers.prices.edit',
    delete: 'site.suppliers.prices.delete',
  },
} as const;
