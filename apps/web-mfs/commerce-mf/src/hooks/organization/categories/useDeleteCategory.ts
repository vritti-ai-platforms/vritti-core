import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SuccessResponse } from '@/schemas/categories';
import { deleteCategory } from '@/services/organization/categories.service';

export function useDeleteCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCategory,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.categories]);
      options?.onSuccess?.(...args);
    },
  });
}
