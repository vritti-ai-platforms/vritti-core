import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { InvoicesTableResponse } from '@/schemas/invoices';
import { getInvoicesTable } from '@/services/invoices.service';

export const INVOICES_TABLE_KEY = ['commerce', 'invoices', 'table'] as const;

// Fetches invoices table data
export function useInvoicesTable(
  options?: Omit<UseQueryOptions<InvoicesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<InvoicesTableResponse, AxiosError>({
    queryKey: [...INVOICES_TABLE_KEY],
    queryFn: getInvoicesTable,
    ...options,
  });
}
