import { type UseQueryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemBatchesTableResponse } from '@/schemas/inventory-item-batches';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { getInventoryItem, getInventoryItemBatchesTable } from '@/services/inventory-items.service';
import { INVENTORY_ITEM_BATCHES_KEY, INVENTORY_ITEM_KEY } from './keys';

// Fetches inventory item detail by ID; suspends until data is available
export function useInventoryItem(id: string) {
  return useSuspenseQuery<InventoryItemData, AxiosError>({
    queryKey: INVENTORY_ITEM_KEY(id),
    queryFn: () => getInventoryItem(id),
  });
}

export function useInventoryItemBatchesTable(
  itemId: string | null,
  options?: Omit<UseQueryOptions<InventoryItemBatchesTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemBatchesTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_BATCHES_KEY(itemId ?? '')],
    queryFn: () => getInventoryItemBatchesTable(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}
