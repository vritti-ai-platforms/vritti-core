import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import {
  PERSON_ADDRESSES_TABLE_KEY,
  PERSON_BANK_ACCOUNTS_TABLE_KEY,
  PERSON_CONTACTS_TABLE_KEY,
  PERSON_IDENTIFIERS_KEY,
  PERSON_LICENSES_TABLE_KEY,
  PERSON_REGISTRATIONS_TABLE_KEY,
  useAddPersonAddress,
  useAddPersonIdentifier,
  useCreatePersonBankAccount,
  useCreatePersonContact,
  useCreatePersonLicense,
  useCreatePersonRegistration,
  useDeletePersonBankAccount,
  useDeletePersonContact,
  useDeletePersonLicense,
  useDeletePersonRegistration,
  usePersonAddresses,
  usePersonBankAccountsTable,
  usePersonContactsTable,
  usePersonIdentifiers,
  usePersonLicensesTable,
  usePersonRegistrationsTable,
  useRemovePersonAddress,
  useRemovePersonIdentifier,
  useUpdatePersonAddress,
  useUpdatePersonBankAccount,
  useUpdatePersonContact,
  useUpdatePersonLicense,
  useUpdatePersonRegistration,
} from '@/hooks/organization/people';
import { PERSON_IDENTIFIER_TYPE_OPTIONS } from '@/schemas/party-identifiers';
import type {
  AddressesBinding,
  BankAccountsBinding,
  ContactsBinding,
  IdentifiersBinding,
  LicensesBinding,
  RegistrationsBinding,
} from '../party/bindings';

export const personBindings: {
  identifiers: IdentifiersBinding;
  addresses: AddressesBinding;
  registrations: RegistrationsBinding;
  licenses: LicensesBinding;
  bankAccounts: BankAccountsBinding;
  contacts: ContactsBinding;
} = {
  identifiers: {
    permissions: ORG_PEOPLE.identifiers,
    slug: (id) => `commerce-org-person-${id}-identifiers`,
    queryKey: PERSON_IDENTIFIERS_KEY,
    emptyDescription: "Record this person's identity documents like PAN, Aadhaar, or passport.",
    typeOptions: PERSON_IDENTIFIER_TYPE_OPTIONS,
    defaultType: 'PAN',
    valuePlaceholder: 'e.g. ABCDE1234F',
    useList: usePersonIdentifiers,
    useCreate: useAddPersonIdentifier,
    useRemove: useRemovePersonIdentifier,
  },
  addresses: {
    permissions: ORG_PEOPLE.addresses,
    slug: (id) => `commerce-org-person-${id}-addresses`,
    queryKey: PERSON_ADDRESSES_TABLE_KEY,
    emptyDescription: "Record this person's registered, billing, or shipping addresses.",
    useList: usePersonAddresses,
    useCreate: useAddPersonAddress,
    useUpdate: useUpdatePersonAddress,
    useRemove: useRemovePersonAddress,
  },
  registrations: {
    permissions: ORG_PEOPLE.registrations,
    slug: (id) => `commerce-org-person-${id}-registrations`,
    queryKey: PERSON_REGISTRATIONS_TABLE_KEY,
    emptyDescription: "Record this person's tax registration numbers per jurisdiction.",
    useList: usePersonRegistrationsTable,
    useCreate: useCreatePersonRegistration,
    useUpdate: useUpdatePersonRegistration,
    useRemove: useDeletePersonRegistration,
  },
  licenses: {
    permissions: ORG_PEOPLE.licenses,
    slug: (id) => `commerce-org-person-${id}-licenses`,
    queryKey: PERSON_LICENSES_TABLE_KEY,
    emptyDescription: 'Record regulatory licenses like drug, excise, or FSSAI for this person.',
    useList: usePersonLicensesTable,
    useCreate: useCreatePersonLicense,
    useUpdate: useUpdatePersonLicense,
    useRemove: useDeletePersonLicense,
  },
  bankAccounts: {
    permissions: ORG_PEOPLE.bankAccounts,
    slug: (id) => `commerce-org-person-${id}-bank-accounts`,
    queryKey: PERSON_BANK_ACCOUNTS_TABLE_KEY,
    emptyDescription: 'Record the bank accounts used to pay this person.',
    useList: usePersonBankAccountsTable,
    useCreate: useCreatePersonBankAccount,
    useUpdate: useUpdatePersonBankAccount,
    useRemove: useDeletePersonBankAccount,
  },
  contacts: {
    permissions: ORG_PEOPLE.contacts,
    slug: (id) => `commerce-org-person-${id}-contacts`,
    queryKey: PERSON_CONTACTS_TABLE_KEY,
    emptyDescription: 'Record points of contact for this person like ordering, accounts, or escalation.',
    useList: usePersonContactsTable,
    useCreate: useCreatePersonContact,
    useUpdate: useUpdatePersonContact,
    useRemove: useDeletePersonContact,
  },
};
