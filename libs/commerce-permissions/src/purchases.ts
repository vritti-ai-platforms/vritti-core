export const LE_PURCHASES = {
  featureCode: 'purchases',
  view: 'le.purchases.view',
  add: 'le.purchases.add',
  edit: 'le.purchases.edit',
  delete: 'le.purchases.delete',
  approve: 'le.purchases.approve',
  receive: 'le.purchases.receive',
  invoice: 'le.purchases.invoice',
  close: 'le.purchases.close',
  // The quotations requested for a purchase that requires them, and how they compare item by item
  quotations: {
    view: 'le.purchases.quotations.view',
    add: 'le.purchases.quotations.add',
  },
  // The purchasing rules of each site: whether it buys only from suppliers with the item set up there, and whether its
  // sent orders set those supplier items up
  settings: {
    view: 'le.purchases.settings.view',
    edit: 'le.purchases.settings.edit',
  },
} as const;

export const SITE_PURCHASES = {
  featureCode: 'purchases',
  view: 'site.purchases.view',
  add: 'site.purchases.add',
  edit: 'site.purchases.edit',
  delete: 'site.purchases.delete',
  approve: 'site.purchases.approve',
  receive: 'site.purchases.receive',
  invoice: 'site.purchases.invoice',
  close: 'site.purchases.close',
  // The quotations requested for a purchase that requires them, and how they compare item by item
  quotations: {
    view: 'site.purchases.quotations.view',
    add: 'site.purchases.quotations.add',
  },
} as const;
