import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CostCategoriesTableResponse,
  CostCategoryData,
  CreateCostCategoryPayload,
  UpdateCostCategoryPayload,
} from '@/schemas/cost-categories';

const BASE = 'commerce-api/org/cost-categories';

// Fetches the current page of cost categories from the saved table state
export function getCostCategoriesTable(): Promise<CostCategoriesTableResponse> {
  return axios.get<CostCategoriesTableResponse>(`${BASE}/table`).then((r) => r.data);
}

// Creates a cost category; its code and kind stay fixed afterwards
export function createCostCategory(data: CreateCostCategoryPayload): Promise<CreateResponse<CostCategoryData>> {
  return axios.post<CreateResponse<CostCategoryData>>(BASE, data).then((r) => r.data);
}

// Updates a cost category by ID
export function updateCostCategory({
  id,
  data,
}: {
  id: string;
  data: UpdateCostCategoryPayload;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

// Deactivates a cost category so new cost lines can't pick it
export function deactivateCostCategory(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/deactivate`).then((r) => r.data);
}

// Reactivates a deactivated cost category
export function activateCostCategory(id: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${id}/activate`).then((r) => r.data);
}

// Deletes a cost category no cost line references
export function deleteCostCategory(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}
