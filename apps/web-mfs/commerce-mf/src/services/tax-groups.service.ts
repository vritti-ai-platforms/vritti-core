import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  CreateTaxGroupData,
  TaxGroupData,
  TaxGroupsTableResponse,
  UpdateTaxGroupData,
} from '@/schemas/tax-groups';

// Fetches the current page of tax groups for the data table (server-state, BU-scoped via RLS)
export function getTaxGroupsTable(): Promise<TaxGroupsTableResponse> {
  return axios.get<TaxGroupsTableResponse>('commerce-api/tax-groups/table').then((r) => r.data);
}

// Fetches one tax group by ID
export function getTaxGroup(id: string): Promise<TaxGroupData> {
  return axios.get<TaxGroupData>(`commerce-api/tax-groups/${id}`).then((r) => r.data);
}

// Creates a new tax group
export function createTaxGroup(data: CreateTaxGroupData): Promise<CreateResponse<TaxGroupData>> {
  return axios.post<CreateResponse<TaxGroupData>>('commerce-api/tax-groups', data).then((r) => r.data);
}

// Updates a tax group by ID
export function updateTaxGroup({ id, data }: { id: string; data: UpdateTaxGroupData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/tax-groups/${id}`, data).then((r) => r.data);
}

// Deletes a tax group by ID
export function deleteTaxGroup(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/tax-groups/${id}`).then((r) => r.data);
}
