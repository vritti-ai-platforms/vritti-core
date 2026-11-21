import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CategoryFormData, SuccessResponse } from '@/schemas/categories';
import { updateCategory } from '@/services/organization/categories.service';

type UpdateCategoryVariables = { id: string; data: Partial<CategoryFormData> };

export function useUpdateCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateCategoryVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateCategoryVariables>({
    ...options,
    mutationFn: updateCategory,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.categories]);
      options?.onSuccess?.(...args);
    },
  });
}
