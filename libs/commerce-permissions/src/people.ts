// People (person business partners) permission codes — MUST match the cloud catalog's authored codes exactly.
export const ORG_PEOPLE = {
  featureCode: 'people',
  view: 'org.people.view',
  add: 'org.people.add',
  edit: 'org.people.edit',
  delete: 'org.people.delete',
  identifiers: {
    view: 'org.people.identifiers.view',
    add: 'org.people.identifiers.add',
    delete: 'org.people.identifiers.delete',
  },
  addresses: {
    view: 'org.people.addresses.view',
    add: 'org.people.addresses.add',
    edit: 'org.people.addresses.edit',
    delete: 'org.people.addresses.delete',
  },
} as const;
