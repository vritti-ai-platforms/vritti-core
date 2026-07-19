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
import type { SupplierItemSiteRow, SupplierItemSitesTableResponse } from '@/schemas/suppliers';
import {
  type AddSupplierItemSitePayload,
  addSupplierItemSite,
  deleteSupplierItemSite,
  getSupplierItemSitesTable,
  type UpdateSupplierItemSitePayload,
  updateSupplierItemSite,
} from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_ITEM_SITES_TABLE_KEY } from './keys';

// Fetches a supplier item's per-site overrides; self-gates on the items view permission
export function useSupplierItemSitesTable(
  supplierId: string,
  itemId: string,
  options?: Omit<UseQueryOptions<SupplierItemSitesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_SUPPLIERS.items.view);
  return useQuery<SupplierItemSitesTableResponse, AxiosError>({
    queryKey: SUPPLIER_ITEM_SITES_TABLE_KEY(supplierId, itemId),
    queryFn: () => getSupplierItemSitesTable({ supplierId, itemId }),
    ...options,
    enabled: !!supplierId && !!itemId && available && (options?.enabled ?? true),
  });
}

export function useAddSupplierItemSite(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SupplierItemSiteRow, AxiosError, AddSupplierItemSitePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierItemSiteRow, AxiosError, AddSupplierItemSitePayload>({
    ...options,
    mutationFn: (data) => addSupplierItemSite({ supplierId, itemId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_SITES_TABLE_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateSupplierItemSiteVars {
  rowId: string;
  data: UpdateSupplierItemSitePayload;
}

export function useUpdateSupplierItemSite(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierItemSiteVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSupplierItemSiteVars>({
    ...options,
    mutationFn: ({ rowId, data }) => updateSupplierItemSite({ supplierId, itemId, rowId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_SITES_TABLE_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteSupplierItemSite(
  supplierId: string,
  itemId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (rowId) => deleteSupplierItemSite({ supplierId, itemId, rowId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_SITES_TABLE_KEY(supplierId, itemId) });
      options?.onSuccess?.(...args);
    },
  });
}
