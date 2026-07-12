import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteCostCategory } from '@/le/services/cost-categories.service';
import { COST_CATEGORIES_TABLE_KEY } from './keys';

export function useDeleteCostCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCostCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COST_CATEGORIES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
