import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deletePaymentTerm } from '@/services/organization/payment-terms.service';

export function useDeletePaymentTerm(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deletePaymentTerm,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.paymentTerms, Tables.paymentTermRules]);
      options?.onSuccess?.(...args);
    },
  });
}
