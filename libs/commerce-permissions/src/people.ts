// People (person business partners) permission codes — MUST match the cloud catalog's authored codes exactly.
export const ORG_PEOPLE = {
  featureCode: 'people',
  view: 'org.people.view',
  add: 'org.people.add',
  edit: 'org.people.edit',
  delete: 'org.people.delete',
  companies: {
    view: 'org.people.companies.view',
  },
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
  registrations: {
    view: 'org.people.registrations.view',
    add: 'org.people.registrations.add',
    edit: 'org.people.registrations.edit',
    delete: 'org.people.registrations.delete',
  },
  licenses: {
    view: 'org.people.licenses.view',
    add: 'org.people.licenses.add',
    edit: 'org.people.licenses.edit',
    delete: 'org.people.licenses.delete',
  },
  bankAccounts: {
    view: 'org.people.bank-accounts.view',
    add: 'org.people.bank-accounts.add',
    edit: 'org.people.bank-accounts.edit',
    delete: 'org.people.bank-accounts.delete',
  },
  communications: {
    view: 'org.people.communications.view',
    add: 'org.people.communications.add',
    edit: 'org.people.communications.edit',
    delete: 'org.people.communications.delete',
  },
  socialProfiles: {
    view: 'org.people.social-profiles.view',
    add: 'org.people.social-profiles.add',
    edit: 'org.people.social-profiles.edit',
    delete: 'org.people.social-profiles.delete',
  },
  // Saving is the shopper's own act, never staff's — putting words in somebody's mouth is not an
  // administrative action. That is enforced in the catalog rather than by convention: `add` and
  // `delete` are GraphQL-only, so no web role can be granted them, while `view` is on both surfaces
  // because staff do need to see what a person saved.
  wishlist: {
    view: 'org.people.wishlist.view',
    add: 'org.people.wishlist.add',
    delete: 'org.people.wishlist.delete',
  },
  contacts: {
    view: 'org.people.contacts.view',
    add: 'org.people.contacts.add',
    edit: 'org.people.contacts.edit',
    delete: 'org.people.contacts.delete',
  },
} as const;
