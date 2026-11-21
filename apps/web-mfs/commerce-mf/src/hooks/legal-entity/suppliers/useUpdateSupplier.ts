import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { type UpdateSupplierPayload, updateSupplier } from '@/services/legal-entity/suppliers.service';

// Updates a supplier and invalidates table + detail
export function useUpdateSupplier(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateSupplierPayload }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateSupplierPayload }>({
    ...options,
    mutationFn: updateSupplier,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.suppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
