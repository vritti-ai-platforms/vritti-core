import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import {
  COMPANY_ADDRESSES_TABLE_KEY,
  COMPANY_BANK_ACCOUNTS_TABLE_KEY,
  COMPANY_CONTACTS_TABLE_KEY,
  COMPANY_IDENTIFIERS_TABLE_KEY,
  COMPANY_LICENSES_TABLE_KEY,
  COMPANY_REGISTRATIONS_TABLE_KEY,
  useAddCompanyAddress,
  useAddCompanyIdentifier,
  useCompanyAddresses,
  useCompanyBankAccountsTable,
  useCompanyContactsTable,
  useCompanyIdentifiers,
  useCompanyLicensesTable,
  useCompanyRegistrationsTable,
  useCreateCompanyBankAccount,
  useCreateCompanyContact,
  useCreateCompanyLicense,
  useCreateCompanyRegistration,
  useDeleteCompanyBankAccount,
  useDeleteCompanyContact,
  useDeleteCompanyLicense,
  useDeleteCompanyRegistration,
  useRemoveCompanyAddress,
  useRemoveCompanyIdentifier,
  useUpdateCompanyAddress,
  useUpdateCompanyBankAccount,
  useUpdateCompanyContact,
  useUpdateCompanyLicense,
  useUpdateCompanyRegistration,
} from '@/hooks/organization/companies';
import { COMPANY_IDENTIFIER_TYPE_OPTIONS } from '@/schemas/party-identifiers';
import type {
  AddressesBinding,
  BankAccountsBinding,
  ContactsBinding,
  IdentifiersBinding,
  LicensesBinding,
  RegistrationsBinding,
} from '../party/bindings';

export const companyBindings: {
  identifiers: IdentifiersBinding;
  addresses: AddressesBinding;
  registrations: RegistrationsBinding;
  licenses: LicensesBinding;
  bankAccounts: BankAccountsBinding;
  contacts: ContactsBinding;
} = {
  identifiers: {
    permissions: ORG_COMPANIES.identifiers,
    slug: (id) => `commerce-org-company-${id}-identifiers`,
    queryKey: COMPANY_IDENTIFIERS_TABLE_KEY,
    emptyDescription: "Record this company's identifiers like CIN, LEI, or DUNS.",
    typeOptions: COMPANY_IDENTIFIER_TYPE_OPTIONS,
    defaultType: 'CIN',
    valuePlaceholder: 'e.g. U74999KA2020PTC000000',
    useList: useCompanyIdentifiers,
    useCreate: useAddCompanyIdentifier,
    useRemove: useRemoveCompanyIdentifier,
  },
  addresses: {
    permissions: ORG_COMPANIES.addresses,
    slug: (id) => `commerce-org-company-${id}-addresses`,
    queryKey: COMPANY_ADDRESSES_TABLE_KEY,
    emptyDescription: "Record this company's registered, billing, or shipping addresses.",
    useList: useCompanyAddresses,
    useCreate: useAddCompanyAddress,
    useUpdate: useUpdateCompanyAddress,
    useRemove: useRemoveCompanyAddress,
  },
  registrations: {
    permissions: ORG_COMPANIES.registrations,
    slug: (id) => `commerce-org-company-${id}-registrations`,
    queryKey: COMPANY_REGISTRATIONS_TABLE_KEY,
    emptyDescription: "Record this company's tax registration numbers per jurisdiction.",
    useList: useCompanyRegistrationsTable,
    useCreate: useCreateCompanyRegistration,
    useUpdate: useUpdateCompanyRegistration,
    useRemove: useDeleteCompanyRegistration,
  },
  licenses: {
    permissions: ORG_COMPANIES.licenses,
    slug: (id) => `commerce-org-company-${id}-licenses`,
    queryKey: COMPANY_LICENSES_TABLE_KEY,
    emptyDescription: 'Record regulatory licenses like drug, excise, or FSSAI for this company.',
    useList: useCompanyLicensesTable,
    useCreate: useCreateCompanyLicense,
    useUpdate: useUpdateCompanyLicense,
    useRemove: useDeleteCompanyLicense,
  },
  bankAccounts: {
    permissions: ORG_COMPANIES.bankAccounts,
    slug: (id) => `commerce-org-company-${id}-bank-accounts`,
    queryKey: COMPANY_BANK_ACCOUNTS_TABLE_KEY,
    emptyDescription: 'Record the bank accounts used to pay this company.',
    useList: useCompanyBankAccountsTable,
    useCreate: useCreateCompanyBankAccount,
    useUpdate: useUpdateCompanyBankAccount,
    useRemove: useDeleteCompanyBankAccount,
  },
  contacts: {
    permissions: ORG_COMPANIES.contacts,
    slug: (id) => `commerce-org-company-${id}-contacts`,
    queryKey: COMPANY_CONTACTS_TABLE_KEY,
    emptyDescription: 'Record points of contact for this company like ordering, accounts, or escalation.',
    useList: useCompanyContactsTable,
    useCreate: useCreateCompanyContact,
    useUpdate: useUpdateCompanyContact,
    useRemove: useDeleteCompanyContact,
  },
};
