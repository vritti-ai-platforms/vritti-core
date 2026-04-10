import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InvoiceDetail } from '@/schemas/invoices';
import { getInvoice } from '@/services/invoices.service';

// Fetches invoice detail with line items and payments
export function useInvoice(
  id: string | null,
  options?: Omit<UseQueryOptions<InvoiceDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<InvoiceDetail, AxiosError>({
    queryKey: ['commerce', 'invoices', id],
    queryFn: () => getInvoice(id as string),
    enabled: !!id,
    ...options,
  });
}
