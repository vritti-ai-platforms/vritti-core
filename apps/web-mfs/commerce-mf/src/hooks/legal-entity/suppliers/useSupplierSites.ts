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
import type { SupplierSiteRow, SupplierSitesTableResponse } from '@/schemas/suppliers';
import {
  type AddSupplierSitePayload,
  addSupplierSite,
  getSupplierSitesTable,
  removeSupplierSite,
  type UpdateSupplierSitePayload,
  updateSupplierSite,
} from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_KEY, SUPPLIER_SITES_TABLE_KEY } from './keys';

// Fetches a supplier's enrolled sites; self-gates on the sites view permission
export function useSupplierSitesTable(
  supplierId: string,
  options?: Omit<UseQueryOptions<SupplierSitesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_SUPPLIERS.sites.view);
  return useQuery<SupplierSitesTableResponse, AxiosError>({
    queryKey: SUPPLIER_SITES_TABLE_KEY(supplierId),
    queryFn: () => getSupplierSitesTable(supplierId),
    ...options,
    enabled: !!supplierId && available && (options?.enabled ?? true),
  });
}

export function useAddSupplierSite(
  supplierId: string,
  options?: Omit<UseMutationOptions<SupplierSiteRow, AxiosError, AddSupplierSitePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierSiteRow, AxiosError, AddSupplierSitePayload>({
    ...options,
    mutationFn: (data) => addSupplierSite({ supplierId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_SITES_TABLE_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateSupplierSiteVars {
  siteRowId: string;
  data: UpdateSupplierSitePayload;
}

export function useUpdateSupplierSite(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierSiteVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSupplierSiteVars>({
    ...options,
    mutationFn: ({ siteRowId, data }) => updateSupplierSite({ supplierId, siteRowId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_SITES_TABLE_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemoveSupplierSite(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (siteRowId) => removeSupplierSite({ supplierId, siteRowId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_SITES_TABLE_KEY(supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
