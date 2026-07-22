import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddCompanyPersonPayload,
  CompaniesTableResponse,
  CompanyData,
  CompanyPeopleTableResponse,
  CompanyPersonRow,
  CompanyRegistrationFormData,
  CompanyRegistrationsTableResponse,
  CompanyTaxRegistrationRow,
  CreateCompanyPayload,
  UpdateCompanyPayload,
  UpdateCompanyPersonPayload,
} from '@/schemas/companies';
import type { AddAddressPayload, PartyAddressesTableResponse, PartyAddressRow } from '@/schemas/party-addresses';
import type {
  PartyBankAccountPayload,
  PartyBankAccountRow,
  PartyBankAccountsTableResponse,
} from '@/schemas/party-bank-accounts';
import type {
  PartyCommunicationPayload,
  PartyCommunicationRow,
  PartyCommunicationsTableResponse,
  PartyCommunicationUpdatePayload,
} from '@/schemas/party-communications';
import type {
  AddIdentifierPayload,
  PartyIdentifierRow,
  PartyIdentifiersTableResponse,
} from '@/schemas/party-identifiers';
import type { PartyLicensePayload, PartyLicenseRow, PartyLicensesTableResponse } from '@/schemas/party-licenses';
import type {
  PartySocialProfilePayload,
  PartySocialProfileRow,
  PartySocialProfilesTableResponse,
} from '@/schemas/party-social-profiles';

const BASE = 'commerce-api/companies';

export function getCompaniesTable(): Promise<CompaniesTableResponse> {
  return axios.get<CompaniesTableResponse>(`${BASE}/table`).then((r) => r.data);
}

export function getCompany(id: string): Promise<CompanyData> {
  return axios.get<CompanyData>(`${BASE}/${id}`).then((r) => r.data);
}

export function createCompany(data: CreateCompanyPayload): Promise<CreateResponse<CompanyData>> {
  return axios.post<CreateResponse<CompanyData>>(BASE, data).then((r) => r.data);
}

export function updateCompany({ id, data }: { id: string; data: UpdateCompanyPayload }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

export function deleteCompany(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

export function getCompanyPeople(id: string): Promise<CompanyPeopleTableResponse> {
  return axios.get<CompanyPeopleTableResponse>(`${BASE}/${id}/people/table`).then((r) => r.data);
}

export function addCompanyPerson({
  companyId,
  data,
}: {
  companyId: string;
  data: AddCompanyPersonPayload;
}): Promise<CompanyPersonRow> {
  return axios.post<CreateResponse<CompanyPersonRow>>(`${BASE}/${companyId}/people`, data).then((r) => r.data.data);
}

export function updateCompanyPerson({
  companyId,
  companyPersonId,
  data,
}: {
  companyId: string;
  companyPersonId: string;
  data: UpdateCompanyPersonPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${companyId}/people/${companyPersonId}`, data).then((r) => r.data);
}

export function removeCompanyPerson({
  companyId,
  companyPersonId,
}: {
  companyId: string;
  companyPersonId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${companyId}/people/${companyPersonId}`).then((r) => r.data);
}

export function getCompanyRegistrations(id: string): Promise<CompanyRegistrationsTableResponse> {
  return axios.get<CompanyRegistrationsTableResponse>(`${BASE}/${id}/registrations/table`).then((r) => r.data);
}

export function createCompanyRegistration({
  companyId,
  data,
}: {
  companyId: string;
  data: CompanyRegistrationFormData;
}): Promise<CompanyTaxRegistrationRow> {
  return axios
    .post<CreateResponse<CompanyTaxRegistrationRow>>(`${BASE}/${companyId}/registrations`, data)
    .then((r) => r.data.data);
}

export function updateCompanyRegistration({
  companyId,
  registrationId,
  data,
}: {
  companyId: string;
  registrationId: string;
  data: CompanyRegistrationFormData;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${companyId}/registrations/${registrationId}`, data).then((r) => r.data);
}

export function deleteCompanyRegistration({
  companyId,
  registrationId,
}: {
  companyId: string;
  registrationId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${companyId}/registrations/${registrationId}`).then((r) => r.data);
}

export function getCompanyIdentifiers(id: string): Promise<PartyIdentifiersTableResponse> {
  return axios.get<PartyIdentifiersTableResponse>(`${BASE}/${id}/identifiers/table`).then((r) => r.data);
}

export function addCompanyIdentifier({
  companyId,
  data,
}: {
  companyId: string;
  data: AddIdentifierPayload;
}): Promise<PartyIdentifierRow> {
  return axios
    .post<CreateResponse<PartyIdentifierRow>>(`${BASE}/${companyId}/identifiers`, data)
    .then((r) => r.data.data);
}

export function removeCompanyIdentifier({
  companyId,
  identifierId,
}: {
  companyId: string;
  identifierId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${companyId}/identifiers/${identifierId}`).then((r) => r.data);
}

export function getCompanyAddresses(id: string): Promise<PartyAddressesTableResponse> {
  return axios.get<PartyAddressesTableResponse>(`${BASE}/${id}/addresses/table`).then((r) => r.data);
}

export function addCompanyAddress({
  partyId,
  data,
}: {
  partyId: string;
  data: AddAddressPayload;
}): Promise<PartyAddressRow> {
  return axios.post<CreateResponse<PartyAddressRow>>(`${BASE}/${partyId}/addresses`, data).then((r) => r.data.data);
}

export function updateCompanyAddress({
  partyId,
  addressId,
  data,
}: {
  partyId: string;
  addressId: string;
  data: AddAddressPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${partyId}/addresses/${addressId}`, data).then((r) => r.data);
}

export function removeCompanyAddress({
  partyId,
  addressId,
}: {
  partyId: string;
  addressId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${partyId}/addresses/${addressId}`).then((r) => r.data);
}

export function getCompanyLicenses(id: string): Promise<PartyLicensesTableResponse> {
  return axios
    .get<PartyLicensesTableResponse>(`${BASE}/${id}/licenses/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createCompanyLicense({
  companyId,
  data,
}: {
  companyId: string;
  data: PartyLicensePayload;
}): Promise<PartyLicenseRow> {
  return axios.post<CreateResponse<PartyLicenseRow>>(`${BASE}/${companyId}/licenses`, data).then((r) => r.data.data);
}

export function updateCompanyLicense({
  companyId,
  licenseId,
  data,
}: {
  companyId: string;
  licenseId: string;
  data: PartyLicensePayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${companyId}/licenses/${licenseId}`, data).then((r) => r.data);
}

export function deleteCompanyLicense({
  companyId,
  licenseId,
}: {
  companyId: string;
  licenseId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${companyId}/licenses/${licenseId}`).then((r) => r.data);
}

export function getCompanyBankAccounts(id: string): Promise<PartyBankAccountsTableResponse> {
  return axios
    .get<PartyBankAccountsTableResponse>(`${BASE}/${id}/bank-accounts/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createCompanyBankAccount({
  companyId,
  data,
}: {
  companyId: string;
  data: PartyBankAccountPayload;
}): Promise<PartyBankAccountRow> {
  return axios
    .post<CreateResponse<PartyBankAccountRow>>(`${BASE}/${companyId}/bank-accounts`, data)
    .then((r) => r.data.data);
}

export function updateCompanyBankAccount({
  companyId,
  bankAccountId,
  data,
}: {
  companyId: string;
  bankAccountId: string;
  data: PartyBankAccountPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${companyId}/bank-accounts/${bankAccountId}`, data).then((r) => r.data);
}

export function deleteCompanyBankAccount({
  companyId,
  bankAccountId,
}: {
  companyId: string;
  bankAccountId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${companyId}/bank-accounts/${bankAccountId}`).then((r) => r.data);
}

export function getCompanyCommunications(id: string): Promise<PartyCommunicationsTableResponse> {
  return axios
    .get<PartyCommunicationsTableResponse>(`${BASE}/${id}/communications/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createCompanyCommunication({
  companyId,
  data,
}: {
  companyId: string;
  data: PartyCommunicationPayload;
}): Promise<PartyCommunicationRow> {
  return axios
    .post<CreateResponse<PartyCommunicationRow>>(`${BASE}/${companyId}/communications`, data)
    .then((r) => r.data.data);
}

export function updateCompanyCommunication({
  companyId,
  communicationId,
  data,
}: {
  companyId: string;
  communicationId: string;
  data: PartyCommunicationUpdatePayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`${BASE}/${companyId}/communications/${communicationId}`, data)
    .then((r) => r.data);
}

export function deleteCompanyCommunication({
  companyId,
  communicationId,
}: {
  companyId: string;
  communicationId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${companyId}/communications/${communicationId}`).then((r) => r.data);
}

export function getCompanySocialProfiles(id: string): Promise<PartySocialProfilesTableResponse> {
  return axios
    .get<PartySocialProfilesTableResponse>(`${BASE}/${id}/social-profiles/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createCompanySocialProfile({
  companyId,
  data,
}: {
  companyId: string;
  data: PartySocialProfilePayload;
}): Promise<PartySocialProfileRow> {
  return axios
    .post<CreateResponse<PartySocialProfileRow>>(`${BASE}/${companyId}/social-profiles`, data)
    .then((r) => r.data.data);
}

export function updateCompanySocialProfile({
  companyId,
  profileId,
  data,
}: {
  companyId: string;
  profileId: string;
  data: PartySocialProfilePayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${companyId}/social-profiles/${profileId}`, data).then((r) => r.data);
}

export function deleteCompanySocialProfile({
  companyId,
  profileId,
}: {
  companyId: string;
  profileId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${companyId}/social-profiles/${profileId}`).then((r) => r.data);
}
