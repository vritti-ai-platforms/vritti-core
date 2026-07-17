import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddIdentifierPayload,
  IdentifierType,
  PartyIdentifierRow,
  PartyIdentifiersTableResponse,
} from '@/schemas/party-identifiers';
import type {
  AddAddressPayload,
  PartyAddressesTableResponse,
  PartyAddressRow,
} from '@/schemas/party-addresses';
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
  return axios.get<PersonCompaniesTableResponse>(`commerce-api/people/${id}/companies`).then((r) => r.data);
}

export function getPersonIdentifiers(id: string): Promise<PartyIdentifiersTableResponse> {
  return axios.get<PartyIdentifiersTableResponse>(`commerce-api/people/${id}/identifiers`).then((r) => r.data);
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
  return axios.get<PartyAddressesTableResponse>(`commerce-api/people/${id}/addresses`).then((r) => r.data);
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
  return axios.patch<SuccessResponse>(`commerce-api/people/${partyId}/addresses/${addressId}`, data).then((r) => r.data);
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
