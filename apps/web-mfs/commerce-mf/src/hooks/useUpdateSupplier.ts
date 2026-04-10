import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SupplierData } from '@/schemas/suppliers';
import { type UpdateSupplierPayload, updateSupplier } from '@/services/suppliers.service';
import { SUPPLIERS_TABLE_KEY } from './useSuppliersTable';

// Updates a supplier and invalidates table + detail
export function useUpdateSupplier(
  options?: Omit<UseMutationOptions<SupplierData, AxiosError, { id: string; data: UpdateSupplierPayload }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SupplierData, AxiosError, { id: string; data: UpdateSupplierPayload }>({
    ...options,
    mutationFn: updateSupplier,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'suppliers', variables.id] });
      options?.onSuccess?.(...args);
    },
  });
}
