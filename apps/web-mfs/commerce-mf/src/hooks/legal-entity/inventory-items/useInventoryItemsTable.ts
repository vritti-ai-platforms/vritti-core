import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InventoryItemTableResponse } from '@/schemas/inventory-items';
import { getLeInventoryItemsTable } from '@/services/legal-entity/inventory-items.service';
import { LE_INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Fetches the organization's master items for the LE table; self-gates the GET on the LE view permission
export function useInventoryItemsTable(
  options?: Omit<UseQueryOptions<InventoryItemTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_INVENTORY_ITEMS.view);
  return useQuery<InventoryItemTableResponse, AxiosError>({
    queryKey: [...LE_INVENTORY_ITEMS_TABLE_KEY],
    queryFn: getLeInventoryItemsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
