import type { CreateResponse, SuccessResponse, TableResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
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
    .get<CategoryTreeNode[]>('commerce-api/categories/tree', {
      params: search ? { search } : undefined,
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

export function getCategoryCount(): Promise<CategoryCountData> {
  return axios.get<CategoryCountData>('commerce-api/categories/count').then((r) => r.data);
}

export function getCategoryChildrenTable(parentId: string): Promise<TableResponse<CategoryData>> {
  return axios
    .get<TableResponse<CategoryData>>(`commerce-api/categories/${parentId}/children/table`)
    .then((r) => r.data);
}

export function getCategoryItemsTable(categoryId: string): Promise<CategoryItemsTableResponse> {
  return axios.get<CategoryItemsTableResponse>(`commerce-api/categories/${categoryId}/items/table`).then((r) => r.data);
}

export function getCategoryById(id: string): Promise<CategoryData> {
  return axios.get<CategoryData>(`commerce-api/categories/${id}`).then((r) => r.data);
}

export function reorderCategories(data: ReorderCategoriesData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>('commerce-api/categories/reorder', data).then((r) => r.data);
}

export function createCategory(data: CategoryFormData): Promise<CreateResponse<CategoryData>> {
  return axios.post<CreateResponse<CategoryData>>('commerce-api/categories', data).then((r) => r.data);
}

export function updateCategory({
  id,
  data,
}: {
  id: string;
  data: Partial<CategoryFormData>;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/categories/${id}`, data).then((r) => r.data);
}

export function deleteCategory(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/categories/${id}`).then((r) => r.data);
}
