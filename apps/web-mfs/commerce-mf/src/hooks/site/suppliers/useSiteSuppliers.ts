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
import type { SiteSupplierRow, SiteSuppliersTableResponse } from '@/schemas/site-suppliers';
import {
  type EnrollSiteSupplierPayload,
  enrollSiteSupplier,
  getSiteSupplier,
  getSiteSuppliersTable,
  type UpdateSiteEnrollmentPayload,
  unenrollSiteSupplier,
  updateSiteEnrollment,
} from '@/services/site/suppliers.service';
import { SITE_SUPPLIER_KEY, SITE_SUPPLIERS_TABLE_KEY } from './keys';

// Fetches the site's enrolled suppliers; self-gates on the view permission
export function useSiteSuppliersTable(
  options?: Omit<UseQueryOptions<SiteSuppliersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(SITE_SUPPLIERS.view);
  return useQuery<SiteSuppliersTableResponse, AxiosError>({
    queryKey: SITE_SUPPLIERS_TABLE_KEY,
    queryFn: getSiteSuppliersTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}

// Fetches a single enrolled supplier detail by ID
export function useSiteSupplier(id: string) {
  return useSuspenseQuery<SiteSupplierRow, AxiosError>({
    queryKey: SITE_SUPPLIER_KEY(id),
    queryFn: () => getSiteSupplier(id),
  });
}

export function useEnrollSiteSupplier(
  options?: Omit<UseMutationOptions<SiteSupplierRow, AxiosError, EnrollSiteSupplierPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SiteSupplierRow, AxiosError, EnrollSiteSupplierPayload>({
    ...options,
    mutationFn: enrollSiteSupplier,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

interface UpdateEnrollmentVars {
  supplierId: string;
  data: UpdateSiteEnrollmentPayload;
}

export function useUpdateSiteEnrollment(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateEnrollmentVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateEnrollmentVars>({
    ...options,
    mutationFn: ({ supplierId, data }) => updateSiteEnrollment({ supplierId, data }),
    onSuccess: (result, variables, ...rest) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_KEY(variables.supplierId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIERS_TABLE_KEY });
      options?.onSuccess?.(result, variables, ...rest);
    },
  });
}

export function useUnenrollSiteSupplier(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: unenrollSiteSupplier,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
