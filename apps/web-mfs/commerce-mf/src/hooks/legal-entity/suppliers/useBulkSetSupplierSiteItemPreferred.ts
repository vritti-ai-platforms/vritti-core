import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { BulkSetSupplierSiteItemPreferredPayload } from '@/schemas/suppliers';
import { bulkSetSupplierSiteItemPreferred } from '@/services/legal-entity/suppliers.service';

export function useBulkSetSupplierSiteItemPreferred(
  supplierId: string,
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, BulkSetSupplierSiteItemPreferredPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, BulkSetSupplierSiteItemPreferredPayload>({
    ...options,
    mutationFn: (payload) => bulkSetSupplierSiteItemPreferred({ supplierId, ...payload }),
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierSiteItems]);
      options?.onSuccess?.(...args);
    },
  });
}
