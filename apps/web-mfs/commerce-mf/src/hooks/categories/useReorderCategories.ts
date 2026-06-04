import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { ReorderCategoriesData } from '@/schemas/categories';
import { reorderCategories } from '@/services/categories.service';
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
