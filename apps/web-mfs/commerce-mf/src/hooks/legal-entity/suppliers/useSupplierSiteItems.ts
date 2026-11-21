import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type {
  AddSupplierSiteItemPayload,
  SupplierSiteItemRow,
  SupplierSiteItemsTableResponse,
  UpdateSupplierSiteItemVars,
} from '@/schemas/suppliers';
import {
  addSupplierSiteItem,
  deleteSupplierSiteItem,
  getSupplierSiteItemsTable,
  updateSupplierSiteItem,
} from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_SITE_ITEMS_TABLE_KEY } from './keys';

// Fetches the sites a supplier item is set up at; self-gates on the site items view permission
export function useSupplierSiteItemsTable(
  supplierId: string,
  itemId: string,
  options?: Omit<UseQueryOptions<SupplierSiteItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_SUPPLIERS.siteItems.view);
  return useQuery<SupplierSiteItemsTableResponse, AxiosError>({
    queryKey: SUPPLIER_SITE_ITEMS_TABLE_KEY(supplierId, itemId),
    queryFn: () => getSupplierSiteItemsTable({ supplierId, itemId }),
    ...options,
    enabled: !!supplierId && !!itemId && available && (options?.enabled ?? true),
  });
}

export function useAddSupplierSiteItem(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SupplierSiteItemRow, AxiosError, AddSupplierSiteItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierSiteItemRow, AxiosError, AddSupplierSiteItemPayload>({
    ...options,
    mutationFn: (data) => addSupplierSiteItem({ supplierId, itemId, data }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateSupplierSiteItem(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierSiteItemVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSupplierSiteItemVars>({
    ...options,
    mutationFn: ({ supplierSiteItemId, data }) =>
      updateSupplierSiteItem({ supplierId, itemId, supplierSiteItemId, data }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteSupplierSiteItem(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (supplierSiteItemId) => deleteSupplierSiteItem({ supplierId, itemId, supplierSiteItemId }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}
