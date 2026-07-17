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
} as const;
