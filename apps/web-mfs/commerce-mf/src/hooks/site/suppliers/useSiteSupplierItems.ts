import { type UseQueryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { SupplierItemData, SupplierItemsTableResponse } from '@/schemas/suppliers';
import { getSiteSupplierItem, getSiteSupplierItemsTable } from '@/services/site/suppliers.service';
import { SITE_SUPPLIER_ITEM_KEY, SITE_SUPPLIER_ITEMS_TABLE_KEY } from './keys';

// Fetches an enrolled supplier's items; self-gates on the items view permission
export function useSiteSupplierItemsTable(
  supplierId: string,
  options?: Omit<UseQueryOptions<SupplierItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_SUPPLIERS.items.view);
  return useQuery<SupplierItemsTableResponse, AxiosError>({
    queryKey: SITE_SUPPLIER_ITEMS_TABLE_KEY(supplierId),
    queryFn: () => getSiteSupplierItemsTable(supplierId),
    ...options,
    enabled: !!supplierId && available && (options?.enabled ?? true),
  });
}

// Fetches a single enrolled supplier item detail
export function useSiteSupplierItem(supplierId: string, itemId: string) {
  return useSuspenseQuery<SupplierItemData, AxiosError>({
    queryKey: SITE_SUPPLIER_ITEM_KEY(supplierId, itemId),
    queryFn: () => getSiteSupplierItem({ supplierId, itemId }),
  });
}
