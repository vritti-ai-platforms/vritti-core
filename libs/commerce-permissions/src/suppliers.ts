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
  // The default payment term new site enrollments start from; existing enrollments keep theirs
  defaultPaymentTerm: 'le.suppliers.default-payment-term',
  // Stops new purchase orders and goods receipts from the supplier at every site
  purchasingBlock: 'le.suppliers.purchasing-block',
  // Holds payments to the supplier
  paymentBlock: 'le.suppliers.payment-block',
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
  // A supplier item as set up at a site: preferred, lead time
  siteItems: {
    view: 'le.suppliers.site-items.view',
    add: 'le.suppliers.site-items.add',
    edit: 'le.suppliers.site-items.edit',
    delete: 'le.suppliers.site-items.delete',
  },
  // A supplier's enrollment at each site, and the quotations posted to it
  sites: {
    view: 'le.suppliers.sites.view',
    enroll: 'le.suppliers.sites.enroll',
    editEnroll: 'le.suppliers.sites.edit-enroll',
    unenroll: 'le.suppliers.sites.unenroll',
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
  // The supplier's items as set up at this site: terms and prices
  siteItems: {
    view: 'site.suppliers.site-items.view',
    terms: {
      view: 'site.suppliers.site-items.terms.view',
      edit: 'site.suppliers.site-items.terms.edit',
    },
    prices: {
      view: 'site.suppliers.site-items.prices.view',
      add: 'site.suppliers.site-items.prices.add',
      edit: 'site.suppliers.site-items.prices.edit',
      delete: 'site.suppliers.site-items.prices.delete',
    },
  },
  // The site's own quotations, and those posted to it: it posts its own here and removes any posted here
  quotations: {
    view: 'site.suppliers.quotations.view',
    add: 'site.suppliers.quotations.add',
    edit: 'site.suppliers.quotations.edit',
    delete: 'site.suppliers.quotations.delete',
    post: 'site.suppliers.quotations.post',
    remove: 'site.suppliers.quotations.remove',
  },
  // The supplier's invoices for this site, entered and edited from the supplier
  invoices: {
    view: 'site.suppliers.invoices.view',
    add: 'site.suppliers.invoices.add',
    edit: 'site.suppliers.invoices.edit',
  },
} as const;
