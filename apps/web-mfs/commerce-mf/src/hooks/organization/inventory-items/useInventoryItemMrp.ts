import { type UseMutationOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemMrpData, UpsertInventoryItemMrpFormData } from '@/schemas/inventory-item-mrp';
import { getOrgInventoryItemMrp, upsertOrgInventoryItemMrp } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_MRP_KEY } from './keys';

// Fetches the ORG inventory item MRP list (one row per currency)
export function useInventoryItemMrp(inventoryItemId: string | null) {
  return useQuery<InventoryItemMrpData[], AxiosError>({
    queryKey: [...ORG_INVENTORY_ITEM_MRP_KEY(inventoryItemId ?? '')],
    queryFn: () => getOrgInventoryItemMrp(inventoryItemId as string),
    enabled: !!inventoryItemId,
  });
}

// Upserts an MRP amount (per currency) and invalidates the MRP list
export function useUpsertInventoryItemMrp(
  inventoryItemId: string,
  options?: UseMutationOptions<InventoryItemMrpData, AxiosError, UpsertInventoryItemMrpFormData>,
) {
  const queryClient = useQueryClient();
  return useMutation<InventoryItemMrpData, AxiosError, UpsertInventoryItemMrpFormData>({
    mutationFn: (data) => upsertOrgInventoryItemMrp(inventoryItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_MRP_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
