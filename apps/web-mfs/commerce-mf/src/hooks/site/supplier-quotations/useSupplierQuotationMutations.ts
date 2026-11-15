import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { SITE_SUPPLIER_KEY } from '@/hooks/site/suppliers/keys';
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
import { SITE_SUPPLIER_QUOTATIONS_KEY } from './keys';

type Options<TData, TVars> = Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>;

// Quotation edits refresh the supplier's quotations; posting and removal also move its site prices, so they refresh
// everything under the supplier
function useSiteSupplierMutation<TData, TVars>(
  supplierId: string,
  mutationFn: (vars: TVars) => Promise<TData>,
  scope: 'quotations' | 'supplier',
  options?: Options<TData, TVars>,
) {
  const queryClient = useQueryClient();
  return useMutation<TData, AxiosError, TVars>({
    ...options,
    mutationFn,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: scope === 'supplier' ? SITE_SUPPLIER_KEY(supplierId) : SITE_SUPPLIER_QUOTATIONS_KEY(supplierId),
      });
      options?.onSuccess?.(...args);
    },
  });
}

export function useCreateSupplierQuotation(
  supplierId: string,
  options?: Options<SupplierQuotationData, SupplierQuotationPayload>,
) {
  return useSiteSupplierMutation(
    supplierId,
    (data) => createSupplierQuotation({ supplierId, data }),
    'quotations',
    options,
  );
}

export function useUpdateSupplierQuotation(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, Partial<SupplierQuotationPayload>>,
) {
  return useSiteSupplierMutation(
    supplierId,
    (data) => updateSupplierQuotation({ supplierId, quotationId, data }),
    'quotations',
    options,
  );
}

export function useAddSupplierQuotationItem(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, SupplierQuotationItemPayload & { inventoryItemId: string; uomId: string }>,
) {
  return useSiteSupplierMutation(
    supplierId,
    (data) => addSupplierQuotationItem({ supplierId, quotationId, data }),
    'quotations',
    options,
  );
}

export function useUpdateSupplierQuotationItem(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, { itemId: string; data: SupplierQuotationItemPayload }>,
) {
  return useSiteSupplierMutation(
    supplierId,
    ({ itemId, data }) => updateSupplierQuotationItem({ supplierId, quotationId, itemId, data }),
    'quotations',
    options,
  );
}

export function usePostSupplierQuotation(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, void>,
) {
  return useSiteSupplierMutation(
    supplierId,
    () => postSupplierQuotation({ supplierId, quotationId }),
    'supplier',
    options,
  );
}

export function useDeleteSupplierQuotation(supplierId: string, options?: Options<SuccessResponse, string>) {
  return useSiteSupplierMutation(
    supplierId,
    (quotationId) => deleteSupplierQuotation({ supplierId, quotationId }),
    'supplier',
    options,
  );
}

export function useRemoveSupplierQuotationItem(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, string>,
) {
  return useSiteSupplierMutation(
    supplierId,
    (itemId) => removeSupplierQuotationItem({ supplierId, quotationId, itemId }),
    'quotations',
    options,
  );
}

export function useRemoveSupplierQuotationPosting(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, void>,
) {
  return useSiteSupplierMutation(
    supplierId,
    () => removeSupplierQuotationPosting({ supplierId, quotationId }),
    'supplier',
    options,
  );
}
