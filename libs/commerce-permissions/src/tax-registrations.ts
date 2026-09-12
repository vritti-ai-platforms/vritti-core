// Tax-registration permission codes — MUST match the cloud catalog's authored codes exactly.
// LE only: a registration is a legal entity's own GSTIN/VAT number, so it is scoped to the entity
// that holds it rather than to the organization or a site.
export const LE_TAX_REGISTRATIONS = {
  featureCode: 'tax-registrations',
  view: 'le.tax-registrations.view',
  add: 'le.tax-registrations.add',
  edit: 'le.tax-registrations.edit',
  delete: 'le.tax-registrations.delete',
} as const;
