export const LE_SUPPLIERS = {
  featureCode: 'suppliers',
  view: 'le.suppliers.view',
  add: 'le.suppliers.add',
  edit: 'le.suppliers.edit',
  delete: 'le.suppliers.delete',
  toggle: 'le.suppliers.toggle',
  // The currencies a supplier trades in and its default; a change converts nothing, so it is its own grant
  currency: {
    edit: 'le.suppliers.currency.edit',
  },
  items: {
    view: 'le.suppliers.items.view',
    add: 'le.suppliers.items.add',
    edit: 'le.suppliers.items.edit',
    delete: 'le.suppliers.items.delete',
    prices: {
      view: 'le.suppliers.items.prices.view',
      add: 'le.suppliers.items.prices.add',
      edit: 'le.suppliers.items.prices.edit',
      delete: 'le.suppliers.items.prices.delete',
    },
  },
  // A supplier's enrollment at each site, and everything it does at one site
  sites: {
    view: 'le.suppliers.sites.view',
    enroll: 'le.suppliers.sites.enroll',
    editEnroll: 'le.suppliers.sites.edit-enroll',
    unenroll: 'le.suppliers.sites.unenroll',
    // The supplier's items as set up at a site: preferred, lead time
    items: {
      view: 'le.suppliers.sites.items.view',
      add: 'le.suppliers.sites.items.add',
      edit: 'le.suppliers.sites.items.edit',
      delete: 'le.suppliers.sites.items.delete',
    },
    // Quotations posted to a site; posting writes that site's prices, removing it takes them back
    quotations: {
      view: 'le.suppliers.sites.quotations.view',
      add: 'le.suppliers.sites.quotations.add',
      delete: 'le.suppliers.sites.quotations.delete',
    },
  },
  quotations: {
    view: 'le.suppliers.quotations.view',
    add: 'le.suppliers.quotations.add',
    edit: 'le.suppliers.quotations.edit',
    delete: 'le.suppliers.quotations.delete',
  },
} as const;

export const SITE_SUPPLIERS = {
  featureCode: 'suppliers',
  view: 'site.suppliers.view',
  enroll: 'site.suppliers.enroll',
  editEnroll: 'site.suppliers.edit-enroll',
  unenroll: 'site.suppliers.unenroll',
  items: {
    view: 'site.suppliers.items.view',
    terms: {
      view: 'site.suppliers.items.terms.view',
      edit: 'site.suppliers.items.terms.edit',
    },
    prices: {
      view: 'site.suppliers.items.prices.view',
      add: 'site.suppliers.items.prices.add',
      edit: 'site.suppliers.items.prices.edit',
      delete: 'site.suppliers.items.prices.delete',
    },
  },
} as const;
