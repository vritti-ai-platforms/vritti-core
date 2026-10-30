import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  EnrollmentPayload,
  SupplierSiteRef,
  UpdateEnrollmentVars,
  UpdateItemTermsVars,
  UpdateSitePriceVars,
} from '@/components/suppliers/types';
import type { SupplierItemPriceRow } from '@/schemas/suppliers';
import {
  type AddSiteSupplierItemPricePayload,
  enrollSiteSupplier,
  unenrollSiteSupplier,
  updateSiteEnrollment,
  updateSiteSupplierItemTerms,
} from '@/services/site/suppliers.service';
import type { PriceRange } from '@/utils/supplierPrice';
import { SITE_SUPPLIER_KEY, SITE_SUPPLIERS_TABLE_KEY } from './keys';
import {
  useAddSiteSupplierItemPrice,
  useDeleteSiteSupplierItemPrice,
  useSiteSupplierItemPriceHistory,
  useSiteSupplierItemPricesTable,
  useUpdateSiteSupplierItemPrice,
} from './useSiteSupplierItemPrices';
import { useSiteSupplierItem, useSiteSupplierItemsTable } from './useSiteSupplierItems';
import { useSiteSupplier } from './useSiteSuppliers';

type Options<TData, TVars> = Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>;

// The supplier of a site supplier page; the site is the session workspace, so it never appears in the URL
export function useSiteSupplierRef(): SupplierSiteRef {
  const { id: supplierId } = useSlugParams('supplierSlug');
  return { supplierId };
}

export function useSiteSupplierAtSite(ref: SupplierSiteRef) {
  return useSiteSupplier(ref.supplierId);
}

export function useSiteSupplierViewItemsTable(ref: SupplierSiteRef) {
  return useSiteSupplierItemsTable(ref.supplierId);
}

export function useSiteSupplierViewItem(ref: SupplierSiteRef, itemId: string) {
  return useSiteSupplierItem(ref.supplierId, itemId);
}

export function useSiteSupplierViewPricesTable(ref: SupplierSiteRef, itemId: string) {
  return useSiteSupplierItemPricesTable(ref.supplierId, itemId);
}

export function useSiteSupplierViewPriceHistory(ref: SupplierSiteRef, itemId: string, range: PriceRange) {
  return useSiteSupplierItemPriceHistory(ref.supplierId, itemId, range);
}

// The site endpoint addresses its own enrollment by supplier, so the enrollment id goes unused here
export function useEnrollSiteSupplierView(ref: SupplierSiteRef, options?: Options<unknown, EnrollmentPayload>) {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, EnrollmentPayload>({
    ...options,
    mutationFn: (data) => enrollSiteSupplier({ supplierId: ref.supplierId, ...data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_KEY(ref.supplierId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateSiteSupplierEnrollment(
  ref: SupplierSiteRef,
  options?: Options<SuccessResponse, UpdateEnrollmentVars>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateEnrollmentVars>({
    ...options,
    mutationFn: ({ data }) => updateSiteEnrollment({ supplierId: ref.supplierId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_KEY(ref.supplierId) });
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemoveSiteSupplierEnrollment(ref: SupplierSiteRef, options?: Options<SuccessResponse, string>) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: () => unenrollSiteSupplier(ref.supplierId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateSiteSupplierItemTerms(
  ref: SupplierSiteRef,
  itemId: string,
  options?: Options<SuccessResponse, UpdateItemTermsVars>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateItemTermsVars>({
    ...options,
    mutationFn: ({ rowId, data }) => updateSiteSupplierItemTerms({ supplierId: ref.supplierId, itemId, rowId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_KEY(ref.supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}

export function useAddSiteSupplierViewPrice(
  ref: SupplierSiteRef,
  itemId: string,
  options?: Options<SupplierItemPriceRow[], AddSiteSupplierItemPricePayload>,
) {
  return useAddSiteSupplierItemPrice(ref.supplierId, itemId, options);
}

export function useUpdateSiteSupplierViewPrice(
  ref: SupplierSiteRef,
  itemId: string,
  options?: Options<SuccessResponse, UpdateSitePriceVars>,
) {
  return useUpdateSiteSupplierItemPrice(ref.supplierId, itemId, options);
}

export function useDeleteSiteSupplierViewPrice(
  ref: SupplierSiteRef,
  itemId: string,
  options?: Options<SuccessResponse, string>,
) {
  return useDeleteSiteSupplierItemPrice(ref.supplierId, itemId, options);
}
