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
  CreateCompanyFormData,
  UpdateCompanyFormData,
} from '@/schemas/companies';
import type {
  AddAddressPayload,
  PartyAddressesTableResponse,
  PartyAddressRow,
} from '@/schemas/party-addresses';
import type {
  AddIdentifierPayload,
  PartyIdentifierRow,
  PartyIdentifiersTableResponse,
} from '@/schemas/party-identifiers';

const BASE = 'commerce-api/companies';

export function getCompaniesTable(): Promise<CompaniesTableResponse> {
  return axios.get<CompaniesTableResponse>(`${BASE}/table`).then((r) => r.data);
}

export function getCompany(id: string): Promise<CompanyData> {
  return axios.get<CompanyData>(`${BASE}/${id}`).then((r) => r.data);
}

export function createCompany(data: CreateCompanyFormData): Promise<CreateResponse<CompanyData>> {
  return axios.post<CreateResponse<CompanyData>>(BASE, data).then((r) => r.data);
}

export function updateCompany({ id, data }: { id: string; data: UpdateCompanyFormData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

export function deleteCompany(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

export function getCompanyPeople(id: string): Promise<CompanyPeopleTableResponse> {
  return axios.get<CompanyPeopleTableResponse>(`${BASE}/${id}/people`).then((r) => r.data);
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
  return axios.get<CompanyRegistrationsTableResponse>(`${BASE}/${id}/registrations`).then((r) => r.data);
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
  return axios.get<PartyIdentifiersTableResponse>(`${BASE}/${id}/identifiers`).then((r) => r.data);
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
  return axios.get<PartyAddressesTableResponse>(`${BASE}/${id}/addresses`).then((r) => r.data);
}

export function addCompanyAddress({
  partyId,
  data,
}: {
  partyId: string;
  data: AddAddressPayload;
}): Promise<PartyAddressRow> {
  return axios
    .post<CreateResponse<PartyAddressRow>>(`${BASE}/${partyId}/addresses`, data)
    .then((r) => r.data.data);
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
