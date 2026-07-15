import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InventoryItemTableResponse } from '@/schemas/inventory-items';
import { getOrgInventoryItemsTable } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Fetches ORG inventory items table
export function useInventoryItemsTable(
  options?: Omit<UseQueryOptions<InventoryItemTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<InventoryItemTableResponse, AxiosError>({
    queryKey: [...ORG_INVENTORY_ITEMS_TABLE_KEY],
    queryFn: getOrgInventoryItemsTable,
    ...options,
    enabled: options?.enabled ?? true,
  });
}
