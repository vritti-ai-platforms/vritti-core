import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UpdateVariantData } from '@/schemas/items';
import { batchUpdateVariants } from '@/services/items.service';

interface BatchUpdateParams {
  itemId: string;
  updates: { variantId: string; data: UpdateVariantData }[];
}

type UseBatchUpdateVariantsOptions = Omit<UseMutationOptions<void, AxiosError, BatchUpdateParams>, 'mutationFn'>;

// Batch updates multiple variants and invalidates item detail
export function useBatchUpdateVariants(options?: UseBatchUpdateVariantsOptions) {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, BatchUpdateParams>({
    ...options,
    mutationFn: ({ itemId, updates }) => batchUpdateVariants(itemId, updates),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['item'] });
      options?.onSuccess?.(...args);
    },
  });
}
