import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setSupplierDefaultPaymentTerm } from '@/services/legal-entity/suppliers.service';

export interface SetSupplierDefaultPaymentTermPayload {
  id: string;
  defaultPaymentTermId: string;
}

// Sets a supplier's default payment term and refreshes the table and the supplier
export function useSetSupplierDefaultPaymentTerm(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetSupplierDefaultPaymentTermPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, SetSupplierDefaultPaymentTermPayload>({
    ...options,
    mutationFn: setSupplierDefaultPaymentTerm,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.suppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
