import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedSupplier } from '@/schemas/suppliers';
import { type CreateSupplierPayload, createSupplier } from '@/services/legal-entity/suppliers.service';

// Creates a new supplier and invalidates the table
export function useCreateSupplier(
  options?: Omit<UseMutationOptions<CreateResponse<CreatedSupplier>, AxiosError, CreateSupplierPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<CreatedSupplier>, AxiosError, CreateSupplierPayload>({
    ...options,
    mutationFn: createSupplier,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.suppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
