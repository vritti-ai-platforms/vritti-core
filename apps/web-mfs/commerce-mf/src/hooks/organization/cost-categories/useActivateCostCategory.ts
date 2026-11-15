import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { activateCostCategory } from '@/services/organization/cost-categories.service';
import { COST_CATEGORIES_KEY } from './keys';

// Reactivates a cost category and refreshes the table
export function useActivateCostCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: activateCostCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COST_CATEGORIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
