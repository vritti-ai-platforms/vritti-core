import { type UseQueryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemLotsTableResponse } from '@/schemas/inventory-item-lots';
import type { InventoryItemQuantsTableResponse } from '@/schemas/inventory-item-quants';
import type { InventoryItemData, InventoryItemLedgerTableResponse } from '@/schemas/inventory-items';
import {
  getInventoryItem,
  getInventoryItemLedgerTable,
  getInventoryItemLotsTable,
  getInventoryItemQuantsTable,
} from '@/site/services/inventory-items.service';
import {
  INVENTORY_ITEM_KEY,
  INVENTORY_ITEM_LEDGER_KEY,
  INVENTORY_ITEM_LOTS_KEY,
  INVENTORY_ITEM_QUANTS_KEY,
} from './keys';

// Fetches inventory item detail by ID; suspends until data is available
export function useInventoryItem(id: string) {
  return useSuspenseQuery<InventoryItemData, AxiosError>({
    queryKey: INVENTORY_ITEM_KEY(id),
    queryFn: () => getInventoryItem(id),
  });
}

export function useInventoryItemQuantsTable(
  inventoryItemId: string | null,
  options?: Omit<UseQueryOptions<InventoryItemQuantsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemQuantsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_QUANTS_KEY(inventoryItemId ?? '')],
    queryFn: () => getInventoryItemQuantsTable(inventoryItemId as string),
    enabled: !!inventoryItemId,
    ...options,
  });
}

export function useInventoryItemLotsTable(
  inventoryItemId: string | null,
  options?: Omit<UseQueryOptions<InventoryItemLotsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemLotsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_LOTS_KEY(inventoryItemId ?? '')],
    queryFn: () => getInventoryItemLotsTable(inventoryItemId as string),
    enabled: !!inventoryItemId,
    ...options,
  });
}

export function useInventoryItemLedgerTable(
  inventoryItemId: string | null,
  options?: Omit<UseQueryOptions<InventoryItemLedgerTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InventoryItemLedgerTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEM_LEDGER_KEY(inventoryItemId ?? '')],
    queryFn: () => getInventoryItemLedgerTable(inventoryItemId as string),
    enabled: !!inventoryItemId,
    ...options,
  });
}
