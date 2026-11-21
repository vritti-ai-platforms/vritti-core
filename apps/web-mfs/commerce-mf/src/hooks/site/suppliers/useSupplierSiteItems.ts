import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type {
  SupplierSiteItemDataTableResponse,
  SupplierSiteItemDetail,
  UpdateSupplierSiteItemVars,
} from '@/schemas/suppliers';
import {
  getSupplierSiteItem,
  getSupplierSiteItemsTable,
  updateSupplierSiteItem,
} from '@/services/site/suppliers.service';
import { SITE_SUPPLIER_SITE_ITEM_KEY, SITE_SUPPLIER_SITE_ITEMS_TABLE_KEY } from './keys';

// Fetches an enrolled supplier's items as set up at this site; self-gates on the site items view permission
export function useSupplierSiteItemsTable(
  supplierId: string,
  options?: Omit<UseQueryOptions<SupplierSiteItemDataTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_SUPPLIERS.siteItems.view);
  return useQuery<SupplierSiteItemDataTableResponse, AxiosError>({
    queryKey: SITE_SUPPLIER_SITE_ITEMS_TABLE_KEY(supplierId),
    queryFn: () => getSupplierSiteItemsTable(supplierId),
    ...options,
    enabled: !!supplierId && available && (options?.enabled ?? true),
  });
}

// Fetches a supplier item as set up at this site
export function useSupplierSiteItem(supplierId: string, itemId: string) {
  return useSuspenseQuery<SupplierSiteItemDetail, AxiosError>({
    queryKey: SITE_SUPPLIER_SITE_ITEM_KEY(supplierId, itemId),
    queryFn: () => getSupplierSiteItem({ supplierId, itemId }),
  });
}

export function useUpdateSupplierSiteItem(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierSiteItemVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSupplierSiteItemVars>({
    ...options,
    mutationFn: ({ supplierSiteItemId, data }) => updateSupplierSiteItem({ supplierId, supplierSiteItemId, data }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}
