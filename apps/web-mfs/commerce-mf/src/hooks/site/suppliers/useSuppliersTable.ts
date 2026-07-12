import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuppliersTableResponse } from '@/schemas/suppliers';
import { getSuppliersTable } from '@/services/site/suppliers.service';
import { SUPPLIERS_TABLE_KEY } from './keys';

// Fetches suppliers table data
export function useSuppliersTable(
  options?: Omit<UseQueryOptions<SuppliersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<SuppliersTableResponse, AxiosError>({
    queryKey: [...SUPPLIERS_TABLE_KEY],
    queryFn: getSuppliersTable,
    ...options,
  });
}
