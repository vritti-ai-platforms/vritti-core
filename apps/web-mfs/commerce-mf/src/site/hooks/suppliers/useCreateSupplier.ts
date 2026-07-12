import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierData } from '@/schemas/suppliers';
import { type CreateSupplierPayload, createSupplier } from '@/site/services/suppliers.service';
import { SUPPLIERS_TABLE_KEY } from './keys';

// Creates a new supplier and invalidates the table
export function useCreateSupplier(
  options?: Omit<UseMutationOptions<SupplierData, AxiosError, CreateSupplierPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupplierData, AxiosError, CreateSupplierPayload>({
    ...options,
    mutationFn: createSupplier,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
