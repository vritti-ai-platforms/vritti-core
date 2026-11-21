import { type UseMutationOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type {
  AddInventoryItemMrpFormData,
  InventoryItemMrpData,
  InventoryItemMrpTableResponse,
  UpdateInventoryItemMrpFormData,
} from '@/schemas/inventory-item-mrp';
import {
  addOrgInventoryItemMrp,
  deleteOrgInventoryItemMrp,
  getOrgInventoryItemMrpTable,
  updateOrgInventoryItemMrp,
} from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEM_KEY, ORG_INVENTORY_ITEM_MRP_KEY } from './keys';

const ITEM_ID_INDEX = ORG_INVENTORY_ITEM_KEY('').length - 1;

// The item's MRPs for its data table; keeps the rows on screen while the table state changes, never another item's,
// and self-gates on the MRP view permission
export function useInventoryItemMrpTable(inventoryItemId: string) {
  const { available } = usePermission(ORG_INVENTORY_ITEMS.mrp.view);
  return useQuery<InventoryItemMrpTableResponse, AxiosError>({
    queryKey: ORG_INVENTORY_ITEM_MRP_KEY(inventoryItemId),
    queryFn: () => getOrgInventoryItemMrpTable(inventoryItemId),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[ITEM_ID_INDEX] === inventoryItemId ? previous : undefined,
    enabled: available && !!inventoryItemId,
  });
}

// Adds a new MRP row and invalidates the MRP list and the item's counts
export function useAddInventoryItemMrp(
  inventoryItemId: string,
  options?: UseMutationOptions<InventoryItemMrpData, AxiosError, AddInventoryItemMrpFormData>,
) {
  const queryClient = useQueryClient();
  return useMutation<InventoryItemMrpData, AxiosError, AddInventoryItemMrpFormData>({
    mutationFn: (data) => addOrgInventoryItemMrp({ inventoryItemId, data }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemMrps]);
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
      invalidateWrites(queryClient, [Tables.inventoryItemMrps]);
      options?.onSuccess?.(...args);
    },
  });
}

// Deletes an MRP row and invalidates the MRP list and the item's counts
export function useDeleteInventoryItemMrp(
  inventoryItemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (mrpId) => deleteOrgInventoryItemMrp({ inventoryItemId, mrpId }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemMrps]);
      options?.onSuccess?.(...args);
    },
  });
}
