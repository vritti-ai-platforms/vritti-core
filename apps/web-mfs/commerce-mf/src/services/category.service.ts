import type { AxiosResponse } from 'axios';
import axios from '@vritti/quantum-ui/axios';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../schemas';

interface SuccessResponse {
  success: boolean;
  message: string;
}

// Fetches all categories for an org+bu
export function getCategories(businessUnitId: string): Promise<Category[]> {
  return axios
    .get<Category[]>('commerce-api/categories', { params: { businessUnitId } })
    .then((r: AxiosResponse<Category[]>) => r.data);
}

// Fetches a single category by ID
export function getCategoryById(id: string): Promise<Category> {
  return axios.get<Category>(`commerce-api/categories/${id}`).then((r: AxiosResponse<Category>) => r.data);
}

// Creates a new category
export function createCategory(
  data: CreateCategoryInput & { businessUnitId: string },
): Promise<Category> {
  return axios
    .post<Category>('commerce-api/categories', data, { successMessage: 'Category created' })
    .then((r: AxiosResponse<Category>) => r.data);
}

// Updates an existing category
export function updateCategory(id: string, data: UpdateCategoryInput): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/categories/${id}`, data, { successMessage: 'Category updated' })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}

// Deletes a category
export function deleteCategory(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/categories/${id}`, { successMessage: 'Category deleted' })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}
