import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetSupplierItemDefaultLeadTime } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_KEY } from './keys';

export interface BulkSetSupplierItemDefaultLeadTimePayload {
  supplierItemIds: string[];
  defaultLeadTimeDays: number;
}

export function useBulkSetSupplierItemDefaultLeadTime(
  supplierId: string,
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, BulkSetSupplierItemDefaultLeadTimePayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BulkSetSupplierItemDefaultLeadTimePayload>({
    ...options,
    mutationFn: (payload) => bulkSetSupplierItemDefaultLeadTime({ supplierId, ...payload }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
