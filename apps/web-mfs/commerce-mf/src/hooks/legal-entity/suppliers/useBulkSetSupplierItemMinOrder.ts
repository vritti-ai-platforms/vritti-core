import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkSetSupplierItemMinOrder } from '@/services/legal-entity/suppliers.service';

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
      invalidateWrites(queryClient, [Tables.supplierItems]);
      options?.onSuccess?.(...args);
    },
  });
}
