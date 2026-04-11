import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deleteInventoryItemBatch } from '@/services/inventory-item-batches.service';
import { INVENTORY_ITEM_BATCHES_KEY } from '../inventory-items';

export function useDeleteInventoryItemBatch(
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteInventoryItemBatch,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_BATCHES_KEY(itemId)] });
      options?.onSuccess?.(...args);
    },
  });
}
