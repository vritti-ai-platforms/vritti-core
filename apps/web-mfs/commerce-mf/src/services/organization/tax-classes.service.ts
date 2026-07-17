import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { TaxClassData, TaxClassesTableResponse } from '@/schemas/tax-classes';

export interface CreateTaxClassPayload {
  code: string;
  name: string;
  isActive: boolean;
}

export interface UpdateTaxClassPayload {
  name?: string;
  isActive?: boolean;
}

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

export function deleteTaxClass(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/tax-classes/${id}`).then((r) => r.data);
}
