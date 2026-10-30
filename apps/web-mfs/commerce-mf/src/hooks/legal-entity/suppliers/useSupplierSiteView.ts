import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { useParams } from 'react-router-dom';
import type {
  EnrollmentPayload,
  SupplierSiteRef,
  UpdateEnrollmentVars,
  UpdateItemTermsVars,
  UpdateSitePriceVars,
} from '@/components/suppliers/types';
import type { SupplierAtSiteData } from '@/schemas/site-suppliers';
import type {
  SiteSupplierItemDetail,
  SiteSupplierItemsTableResponse,
  SupplierItemPriceHistory,
  SupplierItemPriceRow,
  SupplierItemPricesTableResponse,
} from '@/schemas/suppliers';
import {
  addSupplierItemPrice,
  addSupplierSite,
  deleteSupplierItemPrice,
  getSupplierAtSite,
  getSupplierItemPriceHistory,
  getSupplierItemPricesTable,
  getSupplierSiteItem,
  getSupplierSiteItemsTable,
  removeSupplierSite,
  updateSupplierItemPrice,
  updateSupplierItemSite,
  updateSupplierSite,
} from '@/services/legal-entity/suppliers.service';
import type { AddSiteSupplierItemPricePayload } from '@/services/site/suppliers.service';
import type { PriceRange } from '@/utils/supplierPrice';
import {
  SUPPLIER_KEY,
  SUPPLIER_SITE_ITEM_KEY,
  SUPPLIER_SITE_ITEM_PRICE_HISTORY_KEY,
  SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY,
  SUPPLIER_SITE_ITEMS_TABLE_KEY,
  SUPPLIER_SITE_KEY,
} from './keys';

// The supplier and site of an LE supplier-site page — `…/<supplier>/<siteId>` names the site `detail`, the item
// page under it `siteId`
export function useSupplierSiteRef(): SupplierSiteRef {
  const { id: supplierId } = useSlugParams('supplierSlug');
  const { siteId, detail } = useParams();
  return { supplierId, siteId: siteId ?? detail };
}

function siteOf(ref: SupplierSiteRef): string {
  return ref.siteId ?? '';
}

export function useSupplierAtSite(ref: SupplierSiteRef) {
  return useSuspenseQuery<SupplierAtSiteData, AxiosError>({
    queryKey: SUPPLIER_SITE_KEY(ref.supplierId, siteOf(ref)),
    queryFn: () => getSupplierAtSite({ supplierId: ref.supplierId, siteId: siteOf(ref) }),
  });
}

// Fetches the supplier's items carried by the site; self-gates on the items view permission
export function useSupplierSiteItemsTable(ref: SupplierSiteRef) {
  const { available } = usePermission(LE_SUPPLIERS.sites.items.view);
  return useQuery<SiteSupplierItemsTableResponse, AxiosError>({
    queryKey: SUPPLIER_SITE_ITEMS_TABLE_KEY(ref.supplierId, siteOf(ref)),
    queryFn: () => getSupplierSiteItemsTable({ supplierId: ref.supplierId, siteId: siteOf(ref) }),
    enabled: !!ref.supplierId && !!ref.siteId && available,
  });
}

export function useSupplierSiteItem(ref: SupplierSiteRef, itemId: string) {
  return useSuspenseQuery<SiteSupplierItemDetail, AxiosError>({
    queryKey: SUPPLIER_SITE_ITEM_KEY(ref.supplierId, siteOf(ref), itemId),
    queryFn: () => getSupplierSiteItem({ supplierId: ref.supplierId, siteId: siteOf(ref), itemId }),
  });
}

// Fetches one site's price timeline for a supplier item; self-gates on the prices view permission
export function useSupplierSiteItemPricesTable(ref: SupplierSiteRef, itemId: string) {
  const { available } = usePermission(LE_SUPPLIERS.items.prices.view);
  return useQuery<SupplierItemPricesTableResponse, AxiosError>({
    queryKey: SUPPLIER_SITE_ITEM_PRICES_TABLE_KEY(ref.supplierId, siteOf(ref), itemId),
    queryFn: () => getSupplierItemPricesTable({ supplierId: ref.supplierId, itemId, siteId: siteOf(ref) }),
    enabled: !!ref.supplierId && !!ref.siteId && !!itemId && available,
  });
}

// Fetches one site's price windows for a supplier item; self-gates on the prices view permission
export function useSupplierSiteItemPriceHistory(ref: SupplierSiteRef, itemId: string, range: PriceRange) {
  const { available } = usePermission(LE_SUPPLIERS.items.prices.view);
  return useQuery<SupplierItemPriceHistory, AxiosError>({
    queryKey: [...SUPPLIER_SITE_ITEM_PRICE_HISTORY_KEY(ref.supplierId, siteOf(ref), itemId), range.from, range.to],
    queryFn: () => getSupplierItemPriceHistory({ supplierId: ref.supplierId, itemId, siteIds: [siteOf(ref)], range }),
    enabled: !!ref.supplierId && !!ref.siteId && !!itemId && available,
  });
}

// Every supplier-site mutation refreshes the whole supplier subtree — tables, the site view and its items
function useInvalidateSupplier(supplierId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
}

type Options<TData, TVars> = Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>;

export function useEnrollSupplierSite(ref: SupplierSiteRef, options?: Options<unknown, EnrollmentPayload>) {
  const invalidate = useInvalidateSupplier(ref.supplierId);
  return useMutation<unknown, AxiosError, EnrollmentPayload>({
    ...options,
    mutationFn: (data) => addSupplierSite({ supplierId: ref.supplierId, data: { siteId: siteOf(ref), ...data } }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateSupplierSiteEnrollment(
  ref: SupplierSiteRef,
  options?: Options<SuccessResponse, UpdateEnrollmentVars>,
) {
  const invalidate = useInvalidateSupplier(ref.supplierId);
  return useMutation<SuccessResponse, AxiosError, UpdateEnrollmentVars>({
    ...options,
    mutationFn: ({ enrollmentId, data }) =>
      updateSupplierSite({ supplierId: ref.supplierId, siteRowId: enrollmentId, data }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useRemoveSupplierSiteEnrollment(ref: SupplierSiteRef, options?: Options<SuccessResponse, string>) {
  const invalidate = useInvalidateSupplier(ref.supplierId);
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (enrollmentId) => removeSupplierSite({ supplierId: ref.supplierId, siteRowId: enrollmentId }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateSupplierSiteItemTerms(
  ref: SupplierSiteRef,
  itemId: string,
  options?: Options<SuccessResponse, UpdateItemTermsVars>,
) {
  const invalidate = useInvalidateSupplier(ref.supplierId);
  return useMutation<SuccessResponse, AxiosError, UpdateItemTermsVars>({
    ...options,
    mutationFn: ({ rowId, data }) => updateSupplierItemSite({ supplierId: ref.supplierId, itemId, rowId, data }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

// Adds a price for this page's site only — the LE endpoint takes a site list, so the site is supplied here
export function useAddSupplierSiteItemPrice(
  ref: SupplierSiteRef,
  itemId: string,
  options?: Options<SupplierItemPriceRow[], AddSiteSupplierItemPricePayload>,
) {
  const invalidate = useInvalidateSupplier(ref.supplierId);
  return useMutation<SupplierItemPriceRow[], AxiosError, AddSiteSupplierItemPricePayload>({
    ...options,
    mutationFn: (data) =>
      addSupplierItemPrice({ supplierId: ref.supplierId, itemId, data: { ...data, siteIds: [siteOf(ref)] } }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdateSupplierSiteItemPrice(
  ref: SupplierSiteRef,
  itemId: string,
  options?: Options<SuccessResponse, UpdateSitePriceVars>,
) {
  const invalidate = useInvalidateSupplier(ref.supplierId);
  return useMutation<SuccessResponse, AxiosError, UpdateSitePriceVars>({
    ...options,
    mutationFn: ({ priceId, data }) => updateSupplierItemPrice({ supplierId: ref.supplierId, itemId, priceId, data }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}

export function useDeleteSupplierSiteItemPrice(
  ref: SupplierSiteRef,
  itemId: string,
  options?: Options<SuccessResponse, string>,
) {
  const invalidate = useInvalidateSupplier(ref.supplierId);
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (priceId) => deleteSupplierItemPrice({ supplierId: ref.supplierId, itemId, priceId }),
    onSuccess: (...args) => {
      invalidate();
      options?.onSuccess?.(...args);
    },
  });
}
