import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { reorderCategories } from '@/services/organization/categories.service';
import type { ReorderCategoriesData } from '@/schemas/categories';
import { CATEGORIES_KEY } from './keys';

export function useReorderCategories(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReorderCategoriesData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, ReorderCategoriesData>({
    ...options,
    mutationFn: reorderCategories,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
