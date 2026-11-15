import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SiteStockTableResponse } from '@/schemas/inventory-items';
import { getInventoryItemsStockTable } from '@/services/site/inventory-items.service';
import { INVENTORY_ITEMS_STOCK_TABLE_KEY } from './keys';

// Fetches every master item with this site's stock levels for it and its stock on hand by location; self-gates on the
// site view permission
export function useInventoryItemsStockTable(
  options?: Omit<UseQueryOptions<SiteStockTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_INVENTORY_ITEMS.view);
  return useQuery<SiteStockTableResponse, AxiosError>({
    queryKey: [...INVENTORY_ITEMS_STOCK_TABLE_KEY],
    queryFn: getInventoryItemsStockTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
