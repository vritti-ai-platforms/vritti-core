export {
  PEOPLE_KEY,
  PEOPLE_TABLE_KEY,
  PERSON_ADDRESSES_TABLE_KEY,
  PERSON_COMPANIES_TABLE_KEY,
  PERSON_IDENTIFIERS_KEY,
  PERSON_KEY,
} from './keys';
export {
  useAddPersonAddress,
  usePersonAddresses,
  useRemovePersonAddress,
  useUpdatePersonAddress,
} from './usePersonAddresses';
export { useCreatePerson } from './useCreatePerson';
export { useDeletePerson } from './useDeletePerson';
export { usePeopleTable } from './usePeopleTable';
export { usePersonById } from './usePersonById';
export { usePersonCompanies } from './usePersonCompanies';
export { useAddPersonIdentifier, usePersonIdentifiers, useRemovePersonIdentifier } from './usePersonIdentifiers';
export { useUpdatePerson } from './useUpdatePerson';
