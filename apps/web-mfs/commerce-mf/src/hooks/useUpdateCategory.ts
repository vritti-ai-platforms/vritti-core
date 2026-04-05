import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryFormData, SuccessResponse } from '@/schemas/categories';
import { updateCategory } from '@/services/categories.service';

type UpdateCategoryVariables = { id: string; data: Partial<CategoryFormData> };

export function useUpdateCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateCategoryVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateCategoryVariables>({
    ...options,
    mutationFn: updateCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      options?.onSuccess?.(...args);
    },
  });
}
