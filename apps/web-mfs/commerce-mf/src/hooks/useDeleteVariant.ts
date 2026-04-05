import type { AxiosError } from 'axios';
import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVariant } from '@/services/items.service';

interface DeleteVariantParams {
  itemId: string;
  variantId: string;
}

type UseDeleteVariantOptions = Omit<UseMutationOptions<void, AxiosError, DeleteVariantParams>, 'mutationFn'>;

// Deletes a single variant from an item
export function useDeleteVariant(options?: UseDeleteVariantOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, DeleteVariantParams>({
    mutationFn: deleteVariant,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['item'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
