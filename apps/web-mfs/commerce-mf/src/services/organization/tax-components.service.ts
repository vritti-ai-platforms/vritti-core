import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateTaxComponentPayload,
  TaxComponentData,
  TaxComponentsTableResponse,
  UpdateTaxComponentPayload,
} from '@/schemas/tax-components';

// Fetches the current page of tax components; the country comes from the saved table state
export function getTaxComponentsTable(): Promise<TaxComponentsTableResponse> {
  return axios.get<TaxComponentsTableResponse>('commerce-api/tax-components/table').then((r) => r.data);
}

// Fetches one tax component by ID
export function getTaxComponent(id: string): Promise<TaxComponentData> {
  return axios.get<TaxComponentData>(`commerce-api/tax-components/${id}`).then((r) => r.data);
}

// Creates a tax component in a country
export function createTaxComponent(data: CreateTaxComponentPayload): Promise<TaxComponentData> {
  return axios.post<CreateResponse<TaxComponentData>>('commerce-api/tax-components', data).then((r) => r.data.data);
}

// Updates a tax component by ID; its country and code stay fixed
export function updateTaxComponent({
  id,
  data,
}: {
  id: string;
  data: UpdateTaxComponentPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/tax-components/${id}`, data).then((r) => r.data);
}

// Deletes a tax component by ID
// Activates or deactivates a tax component
export function setTaxComponentActive({ id, isActive }: { id: string; isActive: boolean }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/tax-components/${id}/active`, { isActive }).then((r) => r.data);
}

export function deleteTaxComponent(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/tax-components/${id}`).then((r) => r.data);
}
