import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { bulkSetSupplierItemPreferred } from '@/services/legal-entity/suppliers.service';
import { SUPPLIER_ITEMS_TABLE_KEY } from './keys';

export interface BulkSetSupplierItemPreferredPayload {
  supplierItemIds: string[];
  isPreferred: boolean;
}

export function useBulkSetSupplierItemPreferred(
  supplierId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, BulkSetSupplierItemPreferredPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BulkSetSupplierItemPreferredPayload>({
    ...options,
    mutationFn: (payload) => bulkSetSupplierItemPreferred({ supplierId, ...payload }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEMS_TABLE_KEY(supplierId) });
      options?.onSuccess?.(...args);
    },
  });
}
