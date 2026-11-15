import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ItemStockLevelsData, StockLevelsPayload } from '@/schemas/site-stock-levels';
import {
  getStockLevels,
  removeStockLevels,
  setStockLevels,
  updateStockLevels,
} from '@/services/site/inventory-items.service';
import { INVENTORY_ITEM_STOCK_LEVELS_KEY, INVENTORY_ITEMS_STOCK_TABLE_KEY } from './keys';

type Payload = { inventoryItemId: string; data: StockLevelsPayload };

// Sets an item's stock levels at the current site and invalidates the table and the item's stock levels
export function useSetStockLevels(
  options?: Omit<UseMutationOptions<CreateResponse<{ id: string }>, AxiosError, Payload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<{ id: string }>, AxiosError, Payload>({
    ...options,
    mutationFn: ({ inventoryItemId, data }) => setStockLevels(inventoryItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_STOCK_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCK_LEVELS_KEY(args[1].inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// Updates an item's stock levels at the current site and invalidates the table and the item's stock levels
export function useUpdateStockLevels(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Payload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Payload>({
    ...options,
    mutationFn: ({ inventoryItemId, data }) => updateStockLevels(inventoryItemId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_STOCK_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCK_LEVELS_KEY(args[1].inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}

// Fetches an item's stock levels at the current site, null while none are set; self-gates on the stock levels view
export function useItemStockLevels(
  inventoryItemId: string,
  options?: Omit<UseQueryOptions<ItemStockLevelsData | null, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.stockLevels.view);
  return useQuery<ItemStockLevelsData | null, AxiosError>({
    queryKey: INVENTORY_ITEM_STOCK_LEVELS_KEY(inventoryItemId),
    queryFn: () => getStockLevels(inventoryItemId),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}

// Removes an item's stock levels at the current site and invalidates the table and the item's stock levels
export function useRemoveStockLevels(
  inventoryItemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, void>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, void>({
    ...options,
    mutationFn: () => removeStockLevels(inventoryItemId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_STOCK_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_STOCK_LEVELS_KEY(inventoryItemId) });
      options?.onSuccess?.(...args);
    },
  });
}
