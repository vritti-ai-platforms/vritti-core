import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deletePaymentTerm } from '@/services/organization/payment-terms.service';
import { PAYMENT_TERMS_TABLE_KEY } from './keys';

export function useDeletePaymentTerm(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deletePaymentTerm,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_TERMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
