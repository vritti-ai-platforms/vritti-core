import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteOrgInventoryItem } from '@/services/organization/inventory-items.service';

// Deletes an ORG inventory item and invalidates the table
export function useDeleteInventoryItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteOrgInventoryItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.inventoryItems,
        Tables.inventoryItemLedger,
        Tables.inventoryItemLocations,
        Tables.inventoryItemLots,
        Tables.inventoryItemMrps,
        Tables.inventoryItemQuants,
        Tables.inventoryItemQuantCosts,
        Tables.inventoryItemSerials,
        Tables.inventoryItemSites,
        Tables.inventoryItemStorageTypes,
        Tables.inventoryItemUomConversions,
        Tables.supplierItems,
        Tables.supplierSiteItems,
        Tables.goodsReceiptLines,
        Tables.goodsReceiptLots,
        Tables.stockAdjustmentLines,
        Tables.stockAdjustmentLots,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
