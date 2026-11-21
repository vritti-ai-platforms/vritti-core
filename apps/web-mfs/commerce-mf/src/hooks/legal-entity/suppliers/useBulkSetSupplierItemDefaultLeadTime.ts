import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { bulkSetSupplierItemDefaultLeadTime } from '@/services/legal-entity/suppliers.service';

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
      invalidateWrites(queryClient, [Tables.supplierItems, Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}
