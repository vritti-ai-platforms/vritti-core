import { type UseMutationOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AddInventoryItemMrpFormData,
  InventoryItemMrpData,
  UpdateInventoryItemMrpFormData,
} from '@/schemas/inventory-item-mrp';
import {
  addOrgInventoryItemMrp,
  deleteOrgInventoryItemMrp,
  getOrgInventoryItemMrp,
  updateOrgInventoryItemMrp,
} from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_MRP_KEY } from './keys';

// Fetches the ORG inventory item MRP list (one row per unit + currency)
export function useInventoryItemMrp(inventoryItemId: string | null) {
  const { available } = usePermission(ORG_INVENTORY_ITEMS.mrp.view);
  return useQuery<InventoryItemMrpData[], AxiosError>({
    queryKey: [...ORG_INVENTORY_ITEM_MRP_KEY(inventoryItemId ?? '')],
    queryFn: () => getOrgInventoryItemMrp(inventoryItemId as string),
    enabled: available && !!inventoryItemId,
  });
}

// Adds a new MRP row and invalidates the MRP list
export function useAddInventoryItemMrp(
  inventoryItemId: string,
  options?: UseMutationOptions<InventoryItemMrpData, AxiosError, AddInventoryItemMrpFormData>,
) {
  const queryClient = useQueryClient();
  return useMutation<InventoryItemMrpData, AxiosError, AddInventoryItemMrpFormData>({
    mutationFn: (data) => addOrgInventoryItemMrp({ inventoryItemId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_MRP_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

type UpdateMrpPayload = { mrpId: string; data: UpdateInventoryItemMrpFormData };

// Updates an MRP amount and invalidates the MRP list
export function useUpdateInventoryItemMrp(
  inventoryItemId: string,
  options?: UseMutationOptions<InventoryItemMrpData, AxiosError, UpdateMrpPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation<InventoryItemMrpData, AxiosError, UpdateMrpPayload>({
    mutationFn: ({ mrpId, data }) => updateOrgInventoryItemMrp({ inventoryItemId, mrpId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_MRP_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// Deletes an MRP row and invalidates the MRP list
export function useDeleteInventoryItemMrp(
  inventoryItemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (mrpId) => deleteOrgInventoryItemMrp({ inventoryItemId, mrpId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_MRP_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
