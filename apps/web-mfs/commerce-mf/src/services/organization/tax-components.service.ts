import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AuthorityLevel, TaxComponentData, TaxComponentsTableResponse } from '@/schemas/tax-components';

export interface CreateTaxComponentPayload {
  code: string;
  name: string;
  authorityLevel: AuthorityLevel;
  isRecoverable: boolean;
  isWithholding: boolean;
  isActive: boolean;
}

export interface UpdateTaxComponentPayload {
  name?: string;
  authorityLevel?: AuthorityLevel;
  isRecoverable?: boolean;
  isWithholding?: boolean;
  isActive?: boolean;
}

export function getTaxComponentsTable(): Promise<TaxComponentsTableResponse> {
  return axios
    .get<TaxComponentsTableResponse>('commerce-api/tax-components/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getTaxComponent(id: string): Promise<TaxComponentData> {
  return axios
    .get<TaxComponentData>(`commerce-api/tax-components/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createTaxComponent(data: CreateTaxComponentPayload): Promise<TaxComponentData> {
  return axios.post<CreateResponse<TaxComponentData>>('commerce-api/tax-components', data).then((r) => r.data.data);
}

export function updateTaxComponent({
  id,
  data,
}: {
  id: string;
  data: UpdateTaxComponentPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/tax-components/${id}`, data).then((r) => r.data);
}

export function deleteTaxComponent(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/tax-components/${id}`).then((r) => r.data);
}
