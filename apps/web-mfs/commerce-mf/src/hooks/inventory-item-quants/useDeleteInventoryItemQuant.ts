import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deleteInventoryItemQuant } from '@/services/inventory-item-quants.service';
import { INVENTORY_ITEM_QUANTS_KEY } from '../inventory-items';

export function useDeleteInventoryItemQuant(
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteInventoryItemQuant,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [...INVENTORY_ITEM_QUANTS_KEY(itemId)] });
      options?.onSuccess?.(...args);
    },
  });
}
