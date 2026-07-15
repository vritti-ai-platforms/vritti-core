import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemsTableResponse } from '@/schemas/inventory-items';
import { getInventoryItemsTable } from '@/services/site/inventory-items.service';
import { INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Fetches enabled inventory items at the current site
export function useInventoryItemsTable(
  options?: Omit<UseQueryOptions<InventoryItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<InventoryItemsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEMS_TABLE_KEY],
    queryFn: getInventoryItemsTable,
    ...options,
  });
}
