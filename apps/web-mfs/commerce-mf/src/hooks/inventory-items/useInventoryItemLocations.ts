import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import type {
  InventoryItemLocationData,
  InventoryItemLocationsTableResponse,
} from '@/schemas/inventory-item-locations';
import {
  createInventoryItemLocation,
  deleteInventoryItemLocation,
  getInventoryItemLocationsTable,
  updateInventoryItemLocation,
} from '@/services/inventory-item-locations.service';
import { INVENTORY_ITEM_LOCATIONS_KEY, INVENTORY_ITEM_STOCKS_KEY } from './keys';

export function useInventoryItemLocationsTable(
  itemId: string | null,
  options?: Omit<UseQueryOptions<InventoryItemLocationsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemLocationsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_LOCATIONS_KEY(itemId ?? '')],
    queryFn: () => getInventoryItemLocationsTable(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}

export function useCreateInventoryItemLocation(
  itemId: string,
  options?: UseMutationOptions<
    CreateResponse<InventoryItemLocationData>,
    AxiosError,
    { locationId: string; reorderLevel: number }
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateResponse<InventoryItemLocationData>,
    AxiosError,
    { locationId: string; reorderLevel: number }
  >({
    mutationFn: (data) => createInventoryItemLocation(itemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_LOCATIONS_KEY(itemId) });
      // The inventory_stock_levels view joins inventory_item_locations for reorderLevel,
      // so any add/edit/delete here mutates what the Stocks tab sees.
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCKS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateInventoryItemLocation(
  itemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, { locationConfigId: string; reorderLevel: number }>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { locationConfigId: string; reorderLevel: number }>({
    mutationFn: ({ locationConfigId, reorderLevel }) =>
      updateInventoryItemLocation(itemId, locationConfigId, { reorderLevel }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_LOCATIONS_KEY(itemId) });
      // The inventory_stock_levels view joins inventory_item_locations for reorderLevel,
      // so any add/edit/delete here mutates what the Stocks tab sees.
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCKS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteInventoryItemLocation(
  itemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (locationConfigId) => deleteInventoryItemLocation(itemId, locationConfigId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_LOCATIONS_KEY(itemId) });
      // The inventory_stock_levels view joins inventory_item_locations for reorderLevel,
      // so any add/edit/delete here mutates what the Stocks tab sees.
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCKS_KEY(itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
