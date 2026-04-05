import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemVariant } from '@/schemas/items';
import { generateVariants } from '@/services/items.service';

// Generates variants from item options and invalidates item detail
export function useGenerateVariants(
  options?: Omit<UseMutationOptions<ItemVariant[], AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<ItemVariant[], AxiosError, string>({
    ...options,
    mutationFn: generateVariants,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['item'] });
      options?.onSuccess?.(...args);
    },
  });
}
