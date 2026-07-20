// Companies (organization Business Partners) permission codes — MUST match the cloud catalog's authored codes exactly.
export const ORG_COMPANIES = {
  featureCode: 'companies',
  view: 'org.companies.view',
  add: 'org.companies.add',
  edit: 'org.companies.edit',
  delete: 'org.companies.delete',
  people: {
    view: 'org.companies.people.view',
    add: 'org.companies.people.add',
    delete: 'org.companies.people.delete',
  },
  registrations: {
    view: 'org.companies.registrations.view',
    add: 'org.companies.registrations.add',
    edit: 'org.companies.registrations.edit',
    delete: 'org.companies.registrations.delete',
  },
  identifiers: {
    view: 'org.companies.identifiers.view',
    add: 'org.companies.identifiers.add',
    delete: 'org.companies.identifiers.delete',
  },
  addresses: {
    view: 'org.companies.addresses.view',
    add: 'org.companies.addresses.add',
    edit: 'org.companies.addresses.edit',
    delete: 'org.companies.addresses.delete',
  },
  licenses: {
    view: 'org.companies.licenses.view',
    add: 'org.companies.licenses.add',
    edit: 'org.companies.licenses.edit',
    delete: 'org.companies.licenses.delete',
  },
  bankAccounts: {
    view: 'org.companies.bank-accounts.view',
    add: 'org.companies.bank-accounts.add',
    edit: 'org.companies.bank-accounts.edit',
    delete: 'org.companies.bank-accounts.delete',
  },
  contacts: {
    view: 'org.companies.contacts.view',
    add: 'org.companies.contacts.add',
    edit: 'org.companies.contacts.edit',
    delete: 'org.companies.contacts.delete',
  },
} as const;
