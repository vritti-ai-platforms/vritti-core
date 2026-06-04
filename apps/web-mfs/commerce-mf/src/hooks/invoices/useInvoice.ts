import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InvoiceDetail } from '@/schemas/invoices';
import { getInvoice } from '@/services/invoices.service';
import { INVOICE_KEY } from './keys';

// Fetches invoice detail with line items and payments
export function useInvoice(
  id: string | null,
  options?: Omit<UseQueryOptions<InvoiceDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InvoiceDetail, AxiosError>({
    queryKey: INVOICE_KEY(id ?? ''),
    queryFn: () => getInvoice(id as string),
    enabled: !!id,
    ...options,
  });
}
