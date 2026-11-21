import { type UseMutationOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type {
  CreateInventoryItemLocationFormData,
  InventoryItemLocationData,
  InventoryItemLocationsTableResponse,
  UpdateInventoryItemLocationPayload,
} from '@/schemas/inventory-item-locations';
import {
  createInventoryItemLocation,
  deleteInventoryItemLocation,
  getInventoryItemLocationsTable,
  updateInventoryItemLocation,
} from '@/services/site/inventory-item-locations.service';
import { INVENTORY_ITEM_KEY, INVENTORY_ITEM_LOCATIONS_KEY } from './keys';

const ITEM_ID_INDEX = INVENTORY_ITEM_KEY('').length - 1;

// The item's fixed locations for its data table; keeps the rows on screen while the table state changes, never
// another item's, and self-gates on the locations view permission
export function useInventoryItemLocationsTable(inventoryItemId: string) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.locations.view);
  return useQuery<InventoryItemLocationsTableResponse, AxiosError>({
    queryKey: INVENTORY_ITEM_LOCATIONS_KEY(inventoryItemId),
    queryFn: () => getInventoryItemLocationsTable(inventoryItemId),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[ITEM_ID_INDEX] === inventoryItemId ? previous : undefined,
    enabled: available && !!inventoryItemId,
  });
}

// Assigns the item a fixed location and refreshes the list and the tab counts
export function useCreateInventoryItemLocation(
  inventoryItemId: string,
  options?: Omit<
    UseMutationOptions<CreateResponse<InventoryItemLocationData>, AxiosError, CreateInventoryItemLocationFormData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<InventoryItemLocationData>, AxiosError, CreateInventoryItemLocationFormData>({
    ...options,
    mutationFn: (data) => createInventoryItemLocation(inventoryItemId, data),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemLocations]);
      options?.onSuccess?.(...args);
    },
  });
}

// Blocks or unblocks a fixed location and refreshes the list
export function useUpdateInventoryItemLocation(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateInventoryItemLocationPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateInventoryItemLocationPayload>({
    ...options,
    mutationFn: ({ locationConfigId, isBlocked }) =>
      updateInventoryItemLocation(inventoryItemId, locationConfigId, { isBlocked }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemLocations]);
      options?.onSuccess?.(...args);
    },
  });
}

// Removes a fixed location and refreshes the list and the tab counts
export function useDeleteInventoryItemLocation(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (locationConfigId) => deleteInventoryItemLocation(inventoryItemId, locationConfigId),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inventoryItemLocations]);
      options?.onSuccess?.(...args);
    },
  });
}
