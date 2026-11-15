import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CategoryCountData,
  CategoryData,
  CategoryFormData,
  CategoryItemsTableResponse,
  CategoryTreeNode,
  ReorderCategoriesData,
} from '@/schemas/categories';

export function listCategoryTree(search?: string): Promise<CategoryTreeNode[]> {
  return axios
    .get<CategoryTreeNode[]>('commerce-api/org/categories/tree', {
      params: search ? { search } : undefined,
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function getCategoryCount(): Promise<CategoryCountData> {
  return axios.get<CategoryCountData>('commerce-api/org/categories/count').then((r) => r.data);
}

export function getCategoryChildrenTable(parentId: string): Promise<TableResponse<CategoryData>> {
  return axios
    .get<TableResponse<CategoryData>>(`commerce-api/org/categories/${parentId}/children/table`)
    .then((r) => r.data);
}

export function getCategoryItemsTable(categoryId: string): Promise<CategoryItemsTableResponse> {
  return axios
    .get<CategoryItemsTableResponse>(`commerce-api/org/categories/${categoryId}/items/table`)
    .then((r) => r.data);
}

export function getCategoryById(id: string): Promise<CategoryData> {
  return axios.get<CategoryData>(`commerce-api/org/categories/${id}`).then((r) => r.data);
}

export function reorderCategories(data: ReorderCategoriesData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>('commerce-api/org/categories/reorder', data).then((r) => r.data);
}

export function createCategory(data: CategoryFormData): Promise<CreateResponse<CategoryData>> {
  return axios.post<CreateResponse<CategoryData>>('commerce-api/org/categories', data).then((r) => r.data);
}

export function updateCategory({
  id,
  data,
}: {
  id: string;
  data: Partial<CategoryFormData>;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/org/categories/${id}`, data).then((r) => r.data);
}

export function deleteCategory(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/org/categories/${id}`).then((r) => r.data);
}
