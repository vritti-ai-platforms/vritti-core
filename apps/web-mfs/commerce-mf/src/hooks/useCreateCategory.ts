import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryCreateResponse, CategoryFormData } from '@/schemas/categories';
import { createCategory } from '@/services/categories.service';

export function useCreateCategory(
  options?: Omit<
    UseMutationOptions<CategoryCreateResponse, AxiosError, CategoryFormData & { businessUnitId: string }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CategoryCreateResponse, AxiosError, CategoryFormData & { businessUnitId: string }>({
    ...options,
    mutationFn: createCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      options?.onSuccess?.(...args);
    },
  });
}
