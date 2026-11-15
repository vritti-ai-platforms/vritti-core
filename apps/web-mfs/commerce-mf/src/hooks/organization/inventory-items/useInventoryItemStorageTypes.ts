import { type UseMutationOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { STORAGE_TYPES_KEY } from '@/hooks/organization/storage-types';
import type {
  AddInventoryItemStorageTypeFormData,
  InventoryItemStorageTypeData,
  UpdateInventoryItemStorageTypeFormData,
} from '@/schemas/inventory-item-storage-types';
import {
  createOrgInventoryItemStorageType,
  deleteOrgInventoryItemStorageType,
  getOrgInventoryItemStorageTypes,
  updateOrgInventoryItemStorageType,
} from '@/services/organization/inventory-item-storage-types.service';
import { ORG_INVENTORY_ITEM_STORAGE_TYPES_KEY } from './keys';

type UpdatePayload = UpdateInventoryItemStorageTypeFormData & { rowId: string };

// Lists the storage types the item may be stored in; self-gates on the storage types view permission
export function useInventoryItemStorageTypes(inventoryItemId: string) {
  const { available } = usePermission(ORG_INVENTORY_ITEMS.storageTypes.view);
  return useQuery<InventoryItemStorageTypeData[], AxiosError>({
    queryKey: ORG_INVENTORY_ITEM_STORAGE_TYPES_KEY(inventoryItemId),
    queryFn: () => getOrgInventoryItemStorageTypes(inventoryItemId),
    enabled: available && !!inventoryItemId,
  });
}

// Allows the item in a storage type and refreshes its list and the storage types' item counts
export function useCreateInventoryItemStorageType(
  inventoryItemId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<InventoryItemStorageTypeData>, AxiosError, AddInventoryItemStorageTypeFormData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<InventoryItemStorageTypeData>, AxiosError, AddInventoryItemStorageTypeFormData>({
    ...options,
    mutationFn: (data) => createOrgInventoryItemStorageType(inventoryItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_STORAGE_TYPES_KEY(inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: STORAGE_TYPES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

// Changes the item's max quantity per location in a storage type
export function useUpdateInventoryItemStorageType(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePayload>({
    ...options,
    mutationFn: ({ rowId, ...data }) => updateOrgInventoryItemStorageType(inventoryItemId, rowId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_STORAGE_TYPES_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// Removes a storage type from the item and refreshes its list and the storage types' item counts
export function useDeleteInventoryItemStorageType(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (rowId) => deleteOrgInventoryItemStorageType(inventoryItemId, rowId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ORG_INVENTORY_ITEM_STORAGE_TYPES_KEY(inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: STORAGE_TYPES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
