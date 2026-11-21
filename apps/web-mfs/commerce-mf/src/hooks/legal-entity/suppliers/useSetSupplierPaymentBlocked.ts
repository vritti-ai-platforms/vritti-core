import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setSupplierPaymentBlocked } from '@/services/legal-entity/suppliers.service';

export interface SetSupplierPaymentBlockedPayload {
  id: string;
  paymentBlocked: boolean;
}

// Blocks or unblocks payments to a supplier, refreshing the table and the supplier
export function useSetSupplierPaymentBlocked(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetSupplierPaymentBlockedPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, SetSupplierPaymentBlockedPayload>({
    ...options,
    mutationFn: setSupplierPaymentBlocked,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.suppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
