import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { InventoryItemTableResponse } from '@/schemas/inventory-items';
import { getOrgInventoryItemsTable } from '@/services/organization/inventory-items.service';
import { ORG_INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Fetches ORG inventory items table; self-gates the GET on the inventory-items view permission
export function useInventoryItemsTable(
  options?: Omit<UseQueryOptions<InventoryItemTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_INVENTORY_ITEMS.view);
  return useQuery<InventoryItemTableResponse, AxiosError>({
    queryKey: [...ORG_INVENTORY_ITEMS_TABLE_KEY],
    queryFn: getOrgInventoryItemsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
