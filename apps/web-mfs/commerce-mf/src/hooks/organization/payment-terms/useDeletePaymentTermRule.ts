import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deletePaymentTermRule } from '@/services/organization/payment-terms.service';

export function useDeletePaymentTermRule(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { paymentTermId: string; ruleId: string }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { paymentTermId: string; ruleId: string }>({
    ...options,
    mutationFn: deletePaymentTermRule,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.paymentTermRules]);
      options?.onSuccess?.(...args);
    },
  });
}
