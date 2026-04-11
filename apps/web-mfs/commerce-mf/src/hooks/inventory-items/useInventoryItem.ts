import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemData, InventoryLedgerTableResponse, InventoryLevelsTableResponse } from '@/schemas/inventory-items';
import { getInventoryItem, getInventoryItemLedgerTable, getInventoryItemLevelsTable } from '@/services/inventory-items.service';

export const INVENTORY_ITEM_LEVELS_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'levels'] as const;
export const INVENTORY_ITEM_LEDGER_KEY = (itemId: string) => ['commerce', 'inventory-items', itemId, 'ledger'] as const;

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

// Fetches stock levels table for an inventory item
export function useInventoryItemLevelsTable(
  itemId: string | null,
  options?: Omit<UseQueryOptions<InventoryLevelsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryLevelsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_LEVELS_KEY(itemId ?? '')],
    queryFn: () => getInventoryItemLevelsTable(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}

// Fetches ledger table for an inventory item
export function useInventoryItemLedgerTable(
  itemId: string | null,
  options?: Omit<UseQueryOptions<InventoryLedgerTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryLedgerTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_LEDGER_KEY(itemId ?? '')],
    queryFn: () => getInventoryItemLedgerTable(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}
