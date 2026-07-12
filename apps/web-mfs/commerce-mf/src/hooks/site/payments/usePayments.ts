import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PaymentData } from '@/schemas/invoices';
import { getPayments } from '@/services/site/payments.service';
import { INVOICE_PAYMENTS_KEY } from './keys';

// Fetches payments for an invoice
export function usePayments(
  invoiceId: string | null,
  options?: Omit<UseQueryOptions<PaymentData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PaymentData[], AxiosError>({
    queryKey: INVOICE_PAYMENTS_KEY(invoiceId ?? ''),
    queryFn: () => getPayments(invoiceId as string),
    enabled: !!invoiceId,
    ...options,
  });
}
