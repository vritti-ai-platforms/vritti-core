// Payment terms permission codes — MUST match the cloud catalog's authored codes exactly.
export const ORG_PAYMENT_TERMS = {
  featureCode: 'payment-terms',
  view: 'org.payment-terms.view',
  add: 'org.payment-terms.add',
  edit: 'org.payment-terms.edit',
  delete: 'org.payment-terms.delete',
} as const;
