import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AddAddressPayload, PartyAddressesTableResponse, PartyAddressRow } from '@/schemas/party-addresses';
import type {
  PartyBankAccountPayload,
  PartyBankAccountRow,
  PartyBankAccountsTableResponse,
} from '@/schemas/party-bank-accounts';
import type {
  PartyContactPayload,
  PartyContactRow,
  PartyContactsTableResponse,
  PartyContactUpdatePayload,
} from '@/schemas/party-contacts';
import type {
  AddIdentifierPayload,
  IdentifierType,
  PartyIdentifierRow,
  PartyIdentifiersTableResponse,
} from '@/schemas/party-identifiers';
import type { PartyLicensePayload, PartyLicenseRow, PartyLicensesTableResponse } from '@/schemas/party-licenses';
import type {
  PartyRegistrationFormData,
  PartyRegistrationsTableResponse,
  PartyTaxRegistrationRow,
} from '@/schemas/party-registrations';
import type { PeopleTableResponse, PersonCompaniesTableResponse, PersonData } from '@/schemas/people';

export interface CreatePersonPayload {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  identifierType?: IdentifierType;
  identifierValue?: string;
  isActive: boolean;
}

export interface UpdatePersonPayload {
  firstName?: string;
  lastName?: string | null;
  email?: string;
  phone?: string | null;
  isActive?: boolean;
}

export function getPeopleTable(): Promise<PeopleTableResponse> {
  return axios.get<PeopleTableResponse>('commerce-api/people/table').then((r) => r.data);
}

export function getPerson(id: string): Promise<PersonData> {
  return axios.get<PersonData>(`commerce-api/people/${id}`).then((r) => r.data);
}

export function createPerson(data: CreatePersonPayload): Promise<PersonData> {
  return axios.post<CreateResponse<PersonData>>('commerce-api/people', data).then((r) => r.data.data);
}

export function updatePerson({ id, data }: { id: string; data: UpdatePersonPayload }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/people/${id}`, data).then((r) => r.data);
}

export function deletePerson(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/people/${id}`).then((r) => r.data);
}

export function getPersonCompanies(id: string): Promise<PersonCompaniesTableResponse> {
  return axios.get<PersonCompaniesTableResponse>(`commerce-api/people/${id}/companies/table`).then((r) => r.data);
}

export function getPersonIdentifiers(id: string): Promise<PartyIdentifiersTableResponse> {
  return axios.get<PartyIdentifiersTableResponse>(`commerce-api/people/${id}/identifiers/table`).then((r) => r.data);
}

export function addPersonIdentifier({
  personId,
  data,
}: {
  personId: string;
  data: AddIdentifierPayload;
}): Promise<PartyIdentifierRow> {
  return axios
    .post<CreateResponse<PartyIdentifierRow>>(`commerce-api/people/${personId}/identifiers`, data)
    .then((r) => r.data.data);
}

export function removePersonIdentifier({
  personId,
  identifierId,
}: {
  personId: string;
  identifierId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/people/${personId}/identifiers/${identifierId}`)
    .then((r) => r.data);
}

export function getPersonAddresses(id: string): Promise<PartyAddressesTableResponse> {
  return axios.get<PartyAddressesTableResponse>(`commerce-api/people/${id}/addresses/table`).then((r) => r.data);
}

export function addPersonAddress({
  partyId,
  data,
}: {
  partyId: string;
  data: AddAddressPayload;
}): Promise<PartyAddressRow> {
  return axios
    .post<CreateResponse<PartyAddressRow>>(`commerce-api/people/${partyId}/addresses`, data)
    .then((r) => r.data.data);
}

export function updatePersonAddress({
  partyId,
  addressId,
  data,
}: {
  partyId: string;
  addressId: string;
  data: AddAddressPayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/people/${partyId}/addresses/${addressId}`, data)
    .then((r) => r.data);
}

export function removePersonAddress({
  partyId,
  addressId,
}: {
  partyId: string;
  addressId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/people/${partyId}/addresses/${addressId}`).then((r) => r.data);
}

export function getPersonRegistrations(id: string): Promise<PartyRegistrationsTableResponse> {
  return axios
    .get<PartyRegistrationsTableResponse>(`commerce-api/people/${id}/registrations/table`)
    .then((r) => r.data);
}

export function createPersonRegistration({
  personId,
  data,
}: {
  personId: string;
  data: PartyRegistrationFormData;
}): Promise<PartyTaxRegistrationRow> {
  return axios
    .post<CreateResponse<PartyTaxRegistrationRow>>(`commerce-api/people/${personId}/registrations`, data)
    .then((r) => r.data.data);
}

export function updatePersonRegistration({
  personId,
  registrationId,
  data,
}: {
  personId: string;
  registrationId: string;
  data: PartyRegistrationFormData;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/people/${personId}/registrations/${registrationId}`, data)
    .then((r) => r.data);
}

export function deletePersonRegistration({
  personId,
  registrationId,
}: {
  personId: string;
  registrationId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/people/${personId}/registrations/${registrationId}`)
    .then((r) => r.data);
}

export function getPersonLicenses(id: string): Promise<PartyLicensesTableResponse> {
  return axios.get<PartyLicensesTableResponse>(`commerce-api/people/${id}/licenses/table`).then((r) => r.data);
}

export function createPersonLicense({
  personId,
  data,
}: {
  personId: string;
  data: PartyLicensePayload;
}): Promise<PartyLicenseRow> {
  return axios
    .post<CreateResponse<PartyLicenseRow>>(`commerce-api/people/${personId}/licenses`, data)
    .then((r) => r.data.data);
}

export function updatePersonLicense({
  personId,
  licenseId,
  data,
}: {
  personId: string;
  licenseId: string;
  data: PartyLicensePayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/people/${personId}/licenses/${licenseId}`, data)
    .then((r) => r.data);
}

export function deletePersonLicense({
  personId,
  licenseId,
}: {
  personId: string;
  licenseId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/people/${personId}/licenses/${licenseId}`).then((r) => r.data);
}

export function getPersonBankAccounts(id: string): Promise<PartyBankAccountsTableResponse> {
  return axios.get<PartyBankAccountsTableResponse>(`commerce-api/people/${id}/bank-accounts/table`).then((r) => r.data);
}

export function createPersonBankAccount({
  personId,
  data,
}: {
  personId: string;
  data: PartyBankAccountPayload;
}): Promise<PartyBankAccountRow> {
  return axios
    .post<CreateResponse<PartyBankAccountRow>>(`commerce-api/people/${personId}/bank-accounts`, data)
    .then((r) => r.data.data);
}

export function updatePersonBankAccount({
  personId,
  bankAccountId,
  data,
}: {
  personId: string;
  bankAccountId: string;
  data: PartyBankAccountPayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/people/${personId}/bank-accounts/${bankAccountId}`, data)
    .then((r) => r.data);
}

export function deletePersonBankAccount({
  personId,
  bankAccountId,
}: {
  personId: string;
  bankAccountId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/people/${personId}/bank-accounts/${bankAccountId}`)
    .then((r) => r.data);
}

export function getPersonContacts(id: string): Promise<PartyContactsTableResponse> {
  return axios.get<PartyContactsTableResponse>(`commerce-api/people/${id}/contacts/table`).then((r) => r.data);
}

export function createPersonContact({
  personId,
  data,
}: {
  personId: string;
  data: PartyContactPayload;
}): Promise<PartyContactRow> {
  return axios
    .post<CreateResponse<PartyContactRow>>(`commerce-api/people/${personId}/contacts`, data)
    .then((r) => r.data.data);
}

export function updatePersonContact({
  personId,
  contactId,
  data,
}: {
  personId: string;
  contactId: string;
  data: PartyContactUpdatePayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/people/${personId}/contacts/${contactId}`, data)
    .then((r) => r.data);
}

export function deletePersonContact({
  personId,
  contactId,
}: {
  personId: string;
  contactId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/people/${personId}/contacts/${contactId}`).then((r) => r.data);
}
