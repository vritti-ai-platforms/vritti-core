import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetSupplierItemLeadTime } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_KEY } from './keys';

export interface BulkSetSupplierItemLeadTimePayload {
  supplierItemIds: string[];
  leadTimeDays: number | null;
}

export function useBulkSetSupplierItemLeadTime(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BulkSetSupplierItemLeadTimePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BulkSetSupplierItemLeadTimePayload>({
    ...options,
    mutationFn: (payload) => bulkSetSupplierItemLeadTime({ supplierId, ...payload }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
