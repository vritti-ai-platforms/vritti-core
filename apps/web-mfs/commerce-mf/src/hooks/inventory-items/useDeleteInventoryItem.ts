import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteInventoryItem } from '@/services/inventory-items.service';
import { INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Deletes an inventory item and invalidates the table
export function useDeleteInventoryItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteInventoryItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
