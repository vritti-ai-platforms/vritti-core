import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ReorderCategoriesData } from '@/schemas/categories';
import { reorderCategories } from '@/services/organization/categories.service';

export function useReorderCategories(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReorderCategoriesData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, ReorderCategoriesData>({
    ...options,
    mutationFn: reorderCategories,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.categories]);
      options?.onSuccess?.(...args);
    },
  });
}
