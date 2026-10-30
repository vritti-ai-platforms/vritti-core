import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdatePaymentTermPayload } from '@/schemas/payment-terms';
import { updatePaymentTerm } from '@/services/organization/payment-terms.service';
import { PAYMENT_TERM_KEY, PAYMENT_TERMS_TABLE_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdatePaymentTermPayload;
}

export function useUpdatePaymentTerm(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updatePaymentTerm,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: PAYMENT_TERMS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PAYMENT_TERM_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
