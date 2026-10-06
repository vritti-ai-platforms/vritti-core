// Bank-account permission codes — MUST match the cloud catalog's authored codes exactly.
// LE only: a bank account belongs to the legal entity that holds it, so it is scoped to that entity
// rather than to the organization or a site.
export const LE_BANK_ACCOUNTS = {
  featureCode: 'bank-accounts',
  view: 'le.bank-accounts.view',
  add: 'le.bank-accounts.add',
  edit: 'le.bank-accounts.edit',
  delete: 'le.bank-accounts.delete',
} as const;
