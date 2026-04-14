import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CategoryCreateResponse, CategoryFormData } from '@/schemas/categories';
import { createCategory } from '@/services/categories.service';
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
