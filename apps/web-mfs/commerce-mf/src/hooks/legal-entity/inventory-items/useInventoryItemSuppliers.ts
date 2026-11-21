import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddInventoryItemSupplierPayload, SupplierItemData } from '@/schemas/suppliers';
import { addLeInventoryItemSupplier } from '@/services/legal-entity/inventory-items.service';

// Sets the item up as one of a supplier's items and invalidates the item's suppliers table and tab counts
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
      invalidateWrites(queryClient, [Tables.supplierItems, Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}
