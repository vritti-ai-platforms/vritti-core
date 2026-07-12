import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
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
} from '@/site/services/inventory-item-locations.service';
import { INVENTORY_ITEM_LOCATIONS_KEY, INVENTORY_ITEM_STOCKS_KEY } from './keys';

export function useInventoryItemLocationsTable(
  inventoryItemId: string | null,
  options?: Omit<UseQueryOptions<InventoryItemLocationsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemLocationsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_LOCATIONS_KEY(inventoryItemId ?? '')],
    queryFn: () => getInventoryItemLocationsTable(inventoryItemId as string),
    enabled: !!inventoryItemId,
    ...options,
  });
}

export function useCreateInventoryItemLocation(
  inventoryItemId: string,
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
    mutationFn: (data) => createInventoryItemLocation(inventoryItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_LOCATIONS_KEY(inventoryItemId) });
      // inventory_stock_levels joins inventory_item_locations for reorderLevel, so this mutates the Stocks tab.
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCKS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateInventoryItemLocation(
  inventoryItemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, { locationConfigId: string; reorderLevel: number }>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { locationConfigId: string; reorderLevel: number }>({
    mutationFn: ({ locationConfigId, reorderLevel }) =>
      updateInventoryItemLocation(inventoryItemId, locationConfigId, { reorderLevel }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_LOCATIONS_KEY(inventoryItemId) });
      // inventory_stock_levels joins inventory_item_locations for reorderLevel, so this mutates the Stocks tab.
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCKS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteInventoryItemLocation(
  inventoryItemId: string,
  options?: UseMutationOptions<SuccessResponse, AxiosError, string>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (locationConfigId) => deleteInventoryItemLocation(inventoryItemId, locationConfigId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_LOCATIONS_KEY(inventoryItemId) });
      // inventory_stock_levels joins inventory_item_locations for reorderLevel, so this mutates the Stocks tab.
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCKS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
