import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';

import { activatePaymentTerm } from '@/services/organization/payment-terms.service';
import { PAYMENT_TERM_KEY, PAYMENT_TERMS_TABLE_KEY } from './keys';

export function useActivatePaymentTerm(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: activatePaymentTerm,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: PAYMENT_TERMS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PAYMENT_TERM_KEY(vars) });
      options?.onSuccess?.(...args);
    },
  });
}
