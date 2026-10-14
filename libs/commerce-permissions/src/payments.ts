// Payment permission codes — MUST match the cloud catalog's authored codes exactly.
//
// Site-scoped, like carts: a payment is collected at an outlet, against an order that outlet fulfils,
// and settles through the gateway config resolved for that outlet's legal entity. The storefront's
// GraphQL surface claims these through the app credential's per-platform grants.
export const SITE_PAYMENTS = {
  featureCode: 'payments',
  view: 'site.payments.view',
  create: 'site.payments.create',
  cancel: 'site.payments.cancel',
} as const;
