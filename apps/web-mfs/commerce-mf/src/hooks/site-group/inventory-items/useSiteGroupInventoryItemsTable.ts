import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { SITE_GROUP_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SiteGroupInventoryItemsTableResponse } from '@/schemas/inventory-items';
import { getSiteGroupInventoryItemsTable } from '@/services/site-group/inventory-items.service';
import { SITE_GROUP_INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Fetches every master item with how many of the group's sites have it enabled; self-gates on the group view permission
export function useSiteGroupInventoryItemsTable(
  options?: Omit<UseQueryOptions<SiteGroupInventoryItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_GROUP_INVENTORY_ITEMS.view);
  return useQuery<SiteGroupInventoryItemsTableResponse, AxiosError>({
    queryKey: [...SITE_GROUP_INVENTORY_ITEMS_TABLE_KEY],
    queryFn: getSiteGroupInventoryItemsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
