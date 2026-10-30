import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { SUPPLIER_KEY } from '@/hooks/legal-entity/suppliers/keys';
import type {
  SupplierQuotationData,
  SupplierQuotationItemPayload,
  SupplierQuotationPayload,
} from '@/schemas/supplier-quotations';
import {
  addSupplierQuotationItem,
  createSupplierQuotation,
  deleteSupplierQuotation,
  postSupplierQuotationToSite,
  removeSupplierQuotationFromSite,
  removeSupplierQuotationItem,
  updateSupplierQuotation,
  updateSupplierQuotationItem,
} from '@/services/legal-entity/supplier-quotations.service';
import { SUPPLIER_QUOTATIONS_KEY } from './keys';

type Options<TData, TVars> = Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>;

// Quotation edits refresh the supplier's quotations; posting and removal also move its prices, so they refresh
// everything under the supplier
function useSupplierMutation<TData, TVars>(
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
        queryKey: scope === 'supplier' ? SUPPLIER_KEY(supplierId) : SUPPLIER_QUOTATIONS_KEY(supplierId),
      });
      options?.onSuccess?.(...args);
    },
  });
}

export function useCreateSupplierQuotation(
  supplierId: string,
  options?: Options<SupplierQuotationData, SupplierQuotationPayload>,
) {
  return useSupplierMutation(
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
  return useSupplierMutation(
    supplierId,
    (data) => updateSupplierQuotation({ supplierId, quotationId, data }),
    'quotations',
    options,
  );
}

export function useDeleteSupplierQuotation(supplierId: string, options?: Options<SuccessResponse, string>) {
  return useSupplierMutation(
    supplierId,
    (quotationId) => deleteSupplierQuotation({ supplierId, quotationId }),
    'supplier',
    options,
  );
}

export function useAddSupplierQuotationItem(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, SupplierQuotationItemPayload & { inventoryItemId: string; uomId: string }>,
) {
  return useSupplierMutation(
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
  return useSupplierMutation(
    supplierId,
    ({ itemId, data }) => updateSupplierQuotationItem({ supplierId, quotationId, itemId, data }),
    'quotations',
    options,
  );
}

export function useRemoveSupplierQuotationItem(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, string>,
) {
  return useSupplierMutation(
    supplierId,
    (itemId) => removeSupplierQuotationItem({ supplierId, quotationId, itemId }),
    'quotations',
    options,
  );
}

export function usePostSupplierQuotationToSite(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, string>,
) {
  return useSupplierMutation(
    supplierId,
    (siteId) => postSupplierQuotationToSite({ supplierId, quotationId, siteId }),
    'supplier',
    options,
  );
}

export function useRemoveSupplierQuotationFromSite(
  supplierId: string,
  quotationId: string,
  options?: Options<SuccessResponse, string>,
) {
  return useSupplierMutation(
    supplierId,
    (siteId) => removeSupplierQuotationFromSite({ supplierId, quotationId, siteId }),
    'supplier',
    options,
  );
}
