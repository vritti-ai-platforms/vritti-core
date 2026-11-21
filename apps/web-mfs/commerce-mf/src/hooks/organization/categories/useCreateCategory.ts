import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CategoryCreateResponse, CategoryFormData } from '@/schemas/categories';
import { createCategory } from '@/services/organization/categories.service';

export function useCreateCategory(
  options?: Omit<UseMutationOptions<CategoryCreateResponse, AxiosError, CategoryFormData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CategoryCreateResponse, AxiosError, CategoryFormData>({
    ...options,
    mutationFn: createCategory,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.categories]);
      options?.onSuccess?.(...args);
    },
  });
}
