import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddInventoryItemSupplierPayload, SupplierItemData } from '@/schemas/suppliers';
import { addLeInventoryItemSupplier } from '@/services/legal-entity/inventory-items.service';
import { LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY } from './keys';

// Sets the item up as one of a supplier's items and invalidates the item's suppliers table
export function useAddInventoryItemSupplier(
  inventoryItemId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<SupplierItemData>, AxiosError, AddInventoryItemSupplierPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<SupplierItemData>, AxiosError, AddInventoryItemSupplierPayload>({
    ...options,
    mutationFn: (data) => addLeInventoryItemSupplier(inventoryItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: LE_INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
