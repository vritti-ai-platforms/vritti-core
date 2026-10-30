import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreatePaymentTermPayload, PaymentTermData } from '@/schemas/payment-terms';
import { createPaymentTerm } from '@/services/organization/payment-terms.service';
import { PAYMENT_TERMS_TABLE_KEY } from './keys';

export function useCreatePaymentTerm(
  options?: Omit<UseMutationOptions<PaymentTermData, AxiosError, CreatePaymentTermPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PaymentTermData, AxiosError, CreatePaymentTermPayload>({
    ...options,
    mutationFn: createPaymentTerm,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_TERMS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
