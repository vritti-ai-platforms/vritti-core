import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemData, InventoryLedgerData, InventoryLevelData } from '@/schemas/inventory-items';
import { getInventoryItem, getInventoryItemLedger, getInventoryItemLevels } from '@/services/inventory-items.service';

// Fetches a single inventory item
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

// Fetches stock levels for an inventory item
export function useInventoryItemLevels(
  itemId: string | null,
  options?: Omit<UseQueryOptions<InventoryLevelData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryLevelData[], AxiosError>({
    queryKey: ['commerce', 'inventory-items', itemId, 'levels'],
    queryFn: () => getInventoryItemLevels(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}

// Fetches ledger entries for an inventory item
export function useInventoryItemLedger(
  itemId: string | null,
  options?: Omit<UseQueryOptions<InventoryLedgerData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryLedgerData[], AxiosError>({
    queryKey: ['commerce', 'inventory-items', itemId, 'ledger'],
    queryFn: () => getInventoryItemLedger(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}
