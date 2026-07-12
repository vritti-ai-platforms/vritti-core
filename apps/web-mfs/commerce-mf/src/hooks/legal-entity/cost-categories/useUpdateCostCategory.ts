import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type UpdateCostCategoryPayload, updateCostCategory } from '@/services/legal-entity/cost-categories.service';
import { COST_CATEGORIES_TABLE_KEY, COST_CATEGORY_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdateCostCategoryPayload;
}

export function useUpdateCostCategory(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateCostCategory,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: COST_CATEGORIES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: COST_CATEGORY_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
