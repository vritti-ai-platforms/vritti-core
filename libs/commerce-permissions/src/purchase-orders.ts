export const LE_PURCHASE_ORDERS = {
  featureCode: 'purchase-orders',
  view: 'le.purchase-orders.view',
  add: 'le.purchase-orders.add',
  edit: 'le.purchase-orders.edit',
  delete: 'le.purchase-orders.delete',
  invoices: {
    view: 'le.purchase-orders.invoices.view',
  },
} as const;

export const SITE_PURCHASE_ORDERS = {
  featureCode: 'purchase-orders',
  view: 'site.purchase-orders.view',
  add: 'site.purchase-orders.add',
  edit: 'site.purchase-orders.edit',
  delete: 'site.purchase-orders.delete',
  invoices: {
    view: 'site.purchase-orders.invoices.view',
  },
} as const;
