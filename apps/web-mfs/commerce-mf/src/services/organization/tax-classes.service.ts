import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateTaxClassGroupMappingPayload,
  TaxClassData,
  TaxClassesTableResponse,
  UpdateTaxClassGroupMappingPayload,
} from '@/schemas/tax-classes';
import type { TaxClassGroupData, TaxClassGroupsTableResponse } from '@/schemas/tax-groups';

export interface CreateTaxClassPayload {
  code: string;
  name: string;
  isActive: boolean;
}

export interface UpdateTaxClassPayload {
  name: string;
}

// Fetches the current page of tax classes, each with the tax groups it is taxed by in the country and on the day of the
// saved table state
export function getTaxClassesTable(): Promise<TaxClassesTableResponse> {
  return axios
    .get<TaxClassesTableResponse>('commerce-api/tax-classes/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getTaxClass(id: string): Promise<TaxClassData> {
  return axios.get<TaxClassData>(`commerce-api/tax-classes/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

export function createTaxClass(data: CreateTaxClassPayload): Promise<TaxClassData> {
  return axios.post<CreateResponse<TaxClassData>>('commerce-api/tax-classes', data).then((r) => r.data.data);
}

export function updateTaxClass({ id, data }: { id: string; data: UpdateTaxClassPayload }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/tax-classes/${id}`, data).then((r) => r.data);
}

// Activates or deactivates a tax class
export function setTaxClassActive({ id, isActive }: { id: string; isActive: boolean }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/tax-classes/${id}/active`, { isActive }).then((r) => r.data);
}

export function deleteTaxClass(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/tax-classes/${id}`).then((r) => r.data);
}

// Fetches the current page of a tax class's group mappings; the country comes from the saved table state
export function getTaxClassGroupsTable(taxClassId: string): Promise<TaxClassGroupsTableResponse> {
  return axios
    .get<TaxClassGroupsTableResponse>(`commerce-api/tax-classes/${taxClassId}/groups/table`)
    .then((r) => r.data);
}

// Maps a tax class to a tax group in the group's country for a period
export function createTaxClassGroupMapping({
  taxClassId,
  data,
}: {
  taxClassId: string;
  data: CreateTaxClassGroupMappingPayload;
}): Promise<CreateResponse<TaxClassGroupData>> {
  return axios
    .post<CreateResponse<TaxClassGroupData>>(`commerce-api/tax-classes/${taxClassId}/groups`, data)
    .then((r) => r.data);
}

// Updates the price limit or period of one of a tax class's group mappings
export function updateTaxClassGroupMapping({
  taxClassId,
  mappingId,
  data,
}: {
  taxClassId: string;
  mappingId: string;
  data: UpdateTaxClassGroupMappingPayload;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/tax-classes/${taxClassId}/groups/${mappingId}`, data)
    .then((r) => r.data);
}

// Removes one of a tax class's group mappings
export function deleteTaxClassGroupMapping({
  taxClassId,
  mappingId,
}: {
  taxClassId: string;
  mappingId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/tax-classes/${taxClassId}/groups/${mappingId}`)
    .then((r) => r.data);
}
