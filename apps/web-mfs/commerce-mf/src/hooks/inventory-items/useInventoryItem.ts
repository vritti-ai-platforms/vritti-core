import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemBatchesTableResponse } from '@/schemas/inventory-item-batches';
import type { InventoryItemData } from '@/schemas/inventory-items';
import { getInventoryItem, getInventoryItemBatchesTable } from '@/services/inventory-items.service';

export const INVENTORY_ITEM_BATCHES_KEY = (itemId: string) =>
  ['commerce', 'inventory-items', itemId, 'batches'] as const;

export function useInventoryItem(
  id: string | null,
  options?: Omit<UseQueryOptions<InventoryItemData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemData, AxiosError>({
    queryKey: ['commerce', 'inventory-items', id],
    queryFn: () => getInventoryItem(id as string),
    enabled: !!id,
    ...options,
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

