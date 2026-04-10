import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { type CreateInventoryItemPayload, createInventoryItem } from '@/services/inventory-items.service';
import { INVENTORY_ITEMS_TABLE_KEY } from './useInventoryItemsTable';

// Creates a new inventory item and invalidates the table
export function useCreateInventoryItem(
  options?: Omit<UseMutationOptions<InventoryItemData, AxiosError, CreateInventoryItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<InventoryItemData, AxiosError, CreateInventoryItemPayload>({
    ...options,
    mutationFn: createInventoryItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
