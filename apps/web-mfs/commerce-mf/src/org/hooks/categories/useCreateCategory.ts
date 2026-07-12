import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { createCategory } from '@/org/services/categories.service';
import type { CategoryCreateResponse, CategoryFormData } from '@/schemas/categories';
import { CATEGORIES_KEY } from './keys';

export function useCreateCategory(
  options?: Omit<UseMutationOptions<CategoryCreateResponse, AxiosError, CategoryFormData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CategoryCreateResponse, AxiosError, CategoryFormData>({
    ...options,
    mutationFn: createCategory,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
