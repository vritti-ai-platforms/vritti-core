import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, type Table, Tables } from '@/hooks/shared/invalidation';
import type {
  SupplierQuotationData,
  SupplierQuotationItemPayload,
  SupplierQuotationPayload,
} from '@/schemas/supplier-quotations';
import {
  addSupplierQuotationItem,
  createSupplierQuotation,
  deleteSupplierQuotation,
  postSupplierQuotation,
  removeSupplierQuotationItem,
  removeSupplierQuotationPosting,
  updateSupplierQuotation,
  updateSupplierQuotationItem,
} from '@/services/site/supplier-quotations.service';

type Options<TData, TVars> = Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>;

// Every quotation mutation refreshes whatever reads the tables it writes; posting and removal also move prices
function useSiteSupplierMutation<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  tables: readonly Table[],
  options?: Options<TData, TVars>,
) {
  const queryClient = useQueryClient();
  return useMutation<TData, AxiosError, TVars>({
    ...options,
    mutationFn,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, tables);
      options?.onSuccess?.(...args);
    },
  });
}

export function useCreateSupplierQuotation(
  supplierId: string,
  options?: Options<SupplierQuotationData, SupplierQuotationPayload>,
) {
  return useSiteSupplierMutation(
    (data) => createSupplierQuotation({ supplierId, data }),
    [Tables.supplierQuotations],
    options,
  );
}

export function useUpdateSupplierQuotation(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, Partial<SupplierQuotationPayload>>,
) {
  return useSiteSupplierMutation(
    (data) => updateSupplierQuotation({ supplierId, quotationId, data }),
    [Tables.supplierQuotations],
    options,
  );
}

export function useAddSupplierQuotationItem(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, SupplierQuotationItemPayload & { inventoryItemId: string; uomId: string }>,
) {
  return useSiteSupplierMutation(
    (data) => addSupplierQuotationItem({ supplierId, quotationId, data }),
    [Tables.supplierQuotationItems, Tables.inventoryItemMrps],
    options,
  );
}

export function useUpdateSupplierQuotationItem(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, { itemId: string; data: SupplierQuotationItemPayload }>,
) {
  return useSiteSupplierMutation(
    ({ itemId, data }) => updateSupplierQuotationItem({ supplierId, quotationId, itemId, data }),
    [Tables.supplierQuotationItems, Tables.inventoryItemMrps],
    options,
  );
}

export function usePostSupplierQuotation(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, void>,
) {
  return useSiteSupplierMutation(
    () => postSupplierQuotation({ supplierId, quotationId }),
    [Tables.supplierQuotationSites, Tables.supplierItems, Tables.supplierSiteItems, Tables.supplierItemPrices],
    options,
  );
}

export function useDeleteSupplierQuotation(supplierId: string, options?: Options<SuccessResponse, string>) {
  return useSiteSupplierMutation(
    (quotationId) => deleteSupplierQuotation({ supplierId, quotationId }),
    [
      Tables.supplierQuotations,
      Tables.supplierQuotationItems,
      Tables.supplierQuotationSites,
      Tables.supplierItemPrices,
    ],
    options,
  );
}

export function useRemoveSupplierQuotationItem(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, string>,
) {
  return useSiteSupplierMutation(
    (itemId) => removeSupplierQuotationItem({ supplierId, quotationId, itemId }),
    [Tables.supplierQuotationItems],
    options,
  );
}

export function useRemoveSupplierQuotationPosting(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, void>,
) {
  return useSiteSupplierMutation(
    () => removeSupplierQuotationPosting({ supplierId, quotationId }),
    [Tables.supplierItemPrices, Tables.supplierQuotationSites],
    options,
  );
}
