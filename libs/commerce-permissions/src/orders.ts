export const SITE_ORDERS = {
  featureCode: 'orders',
  view: 'site.orders.view',
  add: 'site.orders.add',
  edit: 'site.orders.edit',
  payments: {
    view: 'site.orders.payments.view',
    refund: 'site.orders.payments.refund',
  },
} as const;
