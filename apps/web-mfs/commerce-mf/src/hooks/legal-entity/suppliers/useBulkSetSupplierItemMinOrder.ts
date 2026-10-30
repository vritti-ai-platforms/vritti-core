import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetSupplierItemMinOrder } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_KEY } from './keys';

export interface BulkSetSupplierItemMinOrderPayload {
  supplierItemIds: string[];
  minOrderQuantity: number | null;
}

export function useBulkSetSupplierItemMinOrder(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BulkSetSupplierItemMinOrderPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BulkSetSupplierItemMinOrderPayload>({
    ...options,
    mutationFn: (payload) => bulkSetSupplierItemMinOrder({ supplierId, ...payload }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
