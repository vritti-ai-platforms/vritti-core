import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SupplierData } from '@/schemas/suppliers';
import { type CreateSupplierPayload, createSupplier } from '@/services/legal-entity/suppliers.service';

// Creates a new supplier and invalidates the table
export function useCreateSupplier(
  options?: Omit<UseMutationOptions<SupplierData, AxiosError, CreateSupplierPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupplierData, AxiosError, CreateSupplierPayload>({
    ...options,
    mutationFn: createSupplier,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.suppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
