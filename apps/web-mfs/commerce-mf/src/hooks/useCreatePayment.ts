import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PaymentData } from '@/schemas/invoices';
import { type CreatePaymentPayload, createPayment } from '@/services/payments.service';
import { INVOICES_TABLE_KEY } from './useInvoicesTable';

// Creates a payment and invalidates invoice detail + table
export function useCreatePayment(
  invoiceId: string,
  options?: Omit<UseMutationOptions<PaymentData, AxiosError, CreatePaymentPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<PaymentData, AxiosError, CreatePaymentPayload>({
    ...options,
    mutationFn: createPayment,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'invoices', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'payments', invoiceId] });
      options?.onSuccess?.(...args);
    },
  });
}
