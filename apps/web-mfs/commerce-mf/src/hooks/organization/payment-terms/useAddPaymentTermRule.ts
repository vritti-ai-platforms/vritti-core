import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { PaymentTermRuleFormData } from '@/schemas/payment-terms';
import { addPaymentTermRule } from '@/services/organization/payment-terms.service';

export function useAddPaymentTermRule(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { paymentTermId: string; data: PaymentTermRuleFormData }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { paymentTermId: string; data: PaymentTermRuleFormData }>({
    ...options,
    mutationFn: addPaymentTermRule,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.paymentTermRules]);
      options?.onSuccess?.(...args);
    },
  });
}
