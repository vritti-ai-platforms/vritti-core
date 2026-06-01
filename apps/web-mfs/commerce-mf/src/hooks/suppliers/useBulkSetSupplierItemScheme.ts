import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { bulkSetSupplierItemScheme } from '@/services/suppliers.service';
import { SUPPLIER_ITEMS_TABLE_KEY } from './keys';

export interface BulkSetSupplierItemSchemePayload {
  supplierItemIds: string[];
  schemeBuyQty?: number;
  schemeFreeQty?: number;
  schemeMode: 'none' | 'slab' | 'pro_rata';
}

export function useBulkSetSupplierItemScheme(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BulkSetSupplierItemSchemePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BulkSetSupplierItemSchemePayload>({
    ...options,
    mutationFn: (payload) => bulkSetSupplierItemScheme({ supplierId, ...payload }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
