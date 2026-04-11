import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type { CreateInventoryItemFormData, InventoryItemData } from '@/schemas/inventory-items';
import { createInventoryItem } from '@/services/inventory-items.service';
import { INVENTORY_ITEMS_TABLE_KEY } from './useInventoryItemsTable';

// Creates a new inventory item and invalidates the table
export function useCreateInventoryItem(
  options?: Omit<UseMutationOptions<CreateResponse<InventoryItemData>, AxiosError, CreateInventoryItemFormData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<InventoryItemData>, AxiosError, CreateInventoryItemFormData>({
    ...options,
    mutationFn: createInventoryItem,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
