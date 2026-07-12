import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type CreateCostCategoryPayload, createCostCategory } from '@/services/legal-entity/cost-categories.service';
import type { CostCategoryData } from '@/schemas/cost-categories';
import { COST_CATEGORIES_TABLE_KEY } from './keys';

export function useCreateCostCategory(
  options?: Omit<UseMutationOptions<CostCategoryData, AxiosError, CreateCostCategoryPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CostCategoryData, AxiosError, CreateCostCategoryPayload>({
    ...options,
    mutationFn: createCostCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COST_CATEGORIES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
