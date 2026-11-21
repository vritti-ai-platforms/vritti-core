import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteCostCategory } from '@/services/organization/cost-categories.service';

// Deletes a cost category and refreshes the table
export function useDeleteCostCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCostCategory,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.costCategories]);
      options?.onSuccess?.(...args);
    },
  });
}
