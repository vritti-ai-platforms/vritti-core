import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemsTableResponse } from '@/schemas/inventory-items';
import { getInventoryItemsTable } from '@/site/services/inventory-items.service';
import { INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Fetches inventory items table data
export function useInventoryItemsTable(
  options?: Omit<UseQueryOptions<InventoryItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<InventoryItemsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEMS_TABLE_KEY],
    queryFn: getInventoryItemsTable,
    ...options,
  });
}
