import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { type UpdateInventoryItemPayload, updateInventoryItem } from '@/services/inventory-items.service';
import { INVENTORY_ITEMS_TABLE_KEY } from './useInventoryItemsTable';

// Updates an inventory item and invalidates table + detail
export function useUpdateInventoryItem(
  options?: Omit<UseMutationOptions<InventoryItemData, AxiosError, { id: string; data: UpdateInventoryItemPayload }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<InventoryItemData, AxiosError, { id: string; data: UpdateInventoryItemPayload }>({
    ...options,
    mutationFn: updateInventoryItem,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'inventory-items', variables.id] });
      options?.onSuccess?.(...args);
    },
  });
}
