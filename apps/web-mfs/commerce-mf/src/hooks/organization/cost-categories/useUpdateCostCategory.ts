import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateCostCategoryPayload } from '@/schemas/cost-categories';
import { updateCostCategory } from '@/services/organization/cost-categories.service';

interface Vars {
  id: string;
  data: UpdateCostCategoryPayload;
}

// Updates a cost category and refreshes the table
export function useUpdateCostCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateCostCategory,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.costCategories]);
      options?.onSuccess?.(...args);
    },
  });
}
