import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { updateCategory } from '@/services/organization/categories.service';
import type { CategoryFormData, SuccessResponse } from '@/schemas/categories';
import { CATEGORIES_KEY } from './keys';

type UpdateCategoryVariables = { id: string; data: Partial<CategoryFormData> };

export function useUpdateCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateCategoryVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateCategoryVariables>({
    ...options,
    mutationFn: updateCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
