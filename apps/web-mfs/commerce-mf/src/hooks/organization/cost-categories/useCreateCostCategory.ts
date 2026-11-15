import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CostCategoryData, CreateCostCategoryPayload } from '@/schemas/cost-categories';
import { createCostCategory } from '@/services/organization/cost-categories.service';
import { COST_CATEGORIES_KEY } from './keys';

// Creates a cost category and refreshes the table
export function useCreateCostCategory(
  options?: Omit<
    UseMutationOptions<CreateResponse<CostCategoryData>, AxiosError, CreateCostCategoryPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CostCategoryData>, AxiosError, CreateCostCategoryPayload>({
    ...options,
    mutationFn: createCostCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COST_CATEGORIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
