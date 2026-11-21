import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatePaymentTermPayload, PaymentTermData } from '@/schemas/payment-terms';
import { createPaymentTerm } from '@/services/organization/payment-terms.service';

export function useCreatePaymentTerm(
  options?: Omit<UseMutationOptions<PaymentTermData, AxiosError, CreatePaymentTermPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<PaymentTermData, AxiosError, CreatePaymentTermPayload>({
    ...options,
    mutationFn: createPaymentTerm,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.paymentTerms]);
      options?.onSuccess?.(...args);
    },
  });
}
