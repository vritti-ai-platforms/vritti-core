import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SiteInventoryItemsTableResponse } from '@/schemas/inventory-items';
import { getInventoryItemsTable } from '@/services/site/inventory-items.service';
import { INVENTORY_ITEMS_TABLE_KEY } from './keys';

// Fetches every master item marked with whether this site has it enabled; self-gates on the site view permission
export function useInventoryItemsTable(
  options?: Omit<UseQueryOptions<SiteInventoryItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.view);
  return useQuery<SiteInventoryItemsTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEMS_TABLE_KEY],
    queryFn: getInventoryItemsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
