import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CreateTaxGroupData, TaxGroupData, UpdateTaxGroupData } from '@/schemas/tax-groups';

// Fetches all tax groups visible for the current BU context
export function listTaxGroups(): Promise<TaxGroupData[]> {
  return axios.get<TaxGroupData[]>('commerce-api/tax-groups').then((r) => r.data);
}

// Fetches one tax group by ID
export function getTaxGroup(id: string): Promise<TaxGroupData> {
  return axios.get<TaxGroupData>(`commerce-api/tax-groups/${id}`).then((r) => r.data);
}

// Creates a new tax group
export function createTaxGroup(data: CreateTaxGroupData): Promise<TaxGroupData> {
  return axios.post<TaxGroupData>('commerce-api/tax-groups', data).then((r) => r.data);
}

// Updates a tax group by ID
export function updateTaxGroup({ id, data }: { id: string; data: UpdateTaxGroupData }): Promise<TaxGroupData> {
  return axios.patch<TaxGroupData>(`commerce-api/tax-groups/${id}`, data).then((r) => r.data);
}

// Deletes a tax group by ID
export function deleteTaxGroup(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/tax-groups/${id}`).then((r) => r.data);
}
