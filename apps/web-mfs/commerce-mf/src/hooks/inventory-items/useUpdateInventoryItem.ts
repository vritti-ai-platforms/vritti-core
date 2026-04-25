import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { UpdateInventoryItemFormData } from '@/schemas/inventory-items';
import { updateInventoryItem } from '@/services/inventory-items.service';
import { INVENTORY_ITEM_KEY, INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Updates an inventory item and invalidates table + detail
export function useUpdateInventoryItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateInventoryItemFormData }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateInventoryItemFormData }>({
    ...options,
    mutationFn: updateInventoryItem,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
