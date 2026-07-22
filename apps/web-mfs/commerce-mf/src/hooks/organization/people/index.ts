export {
  PEOPLE_KEY,
  PEOPLE_TABLE_KEY,
  PERSON_ADDRESSES_TABLE_KEY,
  PERSON_BANK_ACCOUNTS_TABLE_KEY,
  PERSON_COMMUNICATIONS_TABLE_KEY,
  PERSON_COMPANIES_TABLE_KEY,
  PERSON_IDENTIFIERS_KEY,
  PERSON_KEY,
  PERSON_LICENSES_TABLE_KEY,
  PERSON_REGISTRATIONS_TABLE_KEY,
  PERSON_SOCIAL_PROFILES_TABLE_KEY,
} from './keys';
export { useCreatePerson } from './useCreatePerson';
export { useDeletePerson } from './useDeletePerson';
export { usePeopleTable } from './usePeopleTable';
export {
  useAddPersonAddress,
  usePersonAddresses,
  useRemovePersonAddress,
  useUpdatePersonAddress,
} from './usePersonAddresses';
export {
  useCreatePersonBankAccount,
  useDeletePersonBankAccount,
  usePersonBankAccountsTable,
  useUpdatePersonBankAccount,
} from './usePersonBankAccounts';
export { usePersonById } from './usePersonById';
export {
  useCreatePersonCommunication,
  useDeletePersonCommunication,
  usePersonCommunicationsTable,
  useUpdatePersonCommunication,
} from './usePersonCommunications';
export { usePersonCompanies } from './usePersonCompanies';
export { useAddPersonIdentifier, usePersonIdentifiers, useRemovePersonIdentifier } from './usePersonIdentifiers';
export {
  useCreatePersonLicense,
  useDeletePersonLicense,
  usePersonLicensesTable,
  useUpdatePersonLicense,
} from './usePersonLicenses';
export {
  useCreatePersonRegistration,
  useDeletePersonRegistration,
  usePersonRegistrationsTable,
  useUpdatePersonRegistration,
} from './usePersonRegistrations';
export {
  useCreatePersonSocialProfile,
  useDeletePersonSocialProfile,
  usePersonSocialProfilesTable,
  useUpdatePersonSocialProfile,
} from './usePersonSocialProfiles';
export { useUpdatePerson } from './useUpdatePerson';
