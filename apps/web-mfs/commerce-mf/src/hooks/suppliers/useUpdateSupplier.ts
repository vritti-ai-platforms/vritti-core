import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type UpdateSupplierPayload, updateSupplier } from '@/services/suppliers.service';
import { SUPPLIER_KEY, SUPPLIERS_TABLE_KEY } from './keys';

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
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
