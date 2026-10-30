import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { PaymentTermRuleFormData } from '@/schemas/payment-terms';
import { updatePaymentTermRule } from '@/services/organization/payment-terms.service';
import { PAYMENT_TERM_KEY, PAYMENT_TERMS_TABLE_KEY } from './keys';

export function useUpdatePaymentTermRule(
  options?: Omit<
    UseMutationOptions<
      SuccessResponse,
      AxiosError,
      { paymentTermId: string; ruleId: string; data: PaymentTermRuleFormData }
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    SuccessResponse,
    AxiosError,
    { paymentTermId: string; ruleId: string; data: PaymentTermRuleFormData }
  >({
    ...options,
    mutationFn: updatePaymentTermRule,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: PAYMENT_TERMS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PAYMENT_TERM_KEY(vars.paymentTermId) });
      options?.onSuccess?.(...args);
    },
  });
}
