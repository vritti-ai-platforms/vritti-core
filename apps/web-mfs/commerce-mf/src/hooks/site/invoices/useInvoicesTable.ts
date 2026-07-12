import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InvoicesTableResponse } from '@/schemas/invoices';
import { getInvoicesTable } from '@/services/site/invoices.service';
import { INVOICES_TABLE_KEY } from './keys';

// Fetches invoices table data
export function useInvoicesTable(
  options?: Omit<UseQueryOptions<InvoicesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<InvoicesTableResponse, AxiosError>({
    queryKey: INVOICES_TABLE_KEY,
    queryFn: getInvoicesTable,
    ...options,
  });
}
