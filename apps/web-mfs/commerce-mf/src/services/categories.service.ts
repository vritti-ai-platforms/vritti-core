import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CategoryData, CategoryFormData } from '@/schemas/categories';

export function listCategories(buId: string): Promise<CategoryData[]> {
  return axios
    .get<CategoryData[]>(`commerce-api/categories?buId=${buId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function createCategory(
  data: CategoryFormData & { businessUnitId: string },
): Promise<CreateResponse<CategoryData>> {
  return axios
    .post<CreateResponse<CategoryData>>('commerce-api/categories', data, {
      loadingMessage: 'Creating category...',
      successMessage: 'Category created',
    })
    .then((r) => r.data);
}

export function updateCategory({
  id,
  data,
}: {
  id: string;
  data: Partial<CategoryFormData>;
}): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/categories/${id}`, data, {
      loadingMessage: 'Updating category...',
      successMessage: 'Category updated',
    })
    .then((r) => r.data);
}

export function deleteCategory(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/categories/${id}`, {
      loadingMessage: 'Deleting category...',
      successMessage: 'Category deleted',
    })
    .then((r) => r.data);
}
