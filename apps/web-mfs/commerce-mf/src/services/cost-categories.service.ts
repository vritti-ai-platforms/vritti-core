import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CostCategoriesTableResponse, CostCategoryData, CostCategoryKind } from '@/schemas/cost-categories';

export interface CreateCostCategoryPayload {
  code: string;
  name: string;
  kind: CostCategoryKind;
}

export interface UpdateCostCategoryPayload {
  name?: string;
  isActive?: boolean;
}

export function getCostCategoriesTable(): Promise<CostCategoriesTableResponse> {
  return axios
    .get<CostCategoriesTableResponse>('commerce-api/cost-categories/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function getCostCategory(id: string): Promise<CostCategoryData> {
  return axios
    .get<CostCategoryData>(`commerce-api/cost-categories/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createCostCategory(data: CreateCostCategoryPayload): Promise<CostCategoryData> {
  return axios
    .post<CreateResponse<CostCategoryData>>('commerce-api/cost-categories', data)
    .then((r) => r.data.data);
}

export function updateCostCategory({
  id,
  data,
}: {
  id: string;
  data: UpdateCostCategoryPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/cost-categories/${id}`, data).then((r) => r.data);
}

export function deactivateCostCategory(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/cost-categories/${id}/deactivate`).then((r) => r.data);
}

export function activateCostCategory(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/cost-categories/${id}/activate`).then((r) => r.data);
}

export function deleteCostCategory(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/cost-categories/${id}`).then((r) => r.data);
}
