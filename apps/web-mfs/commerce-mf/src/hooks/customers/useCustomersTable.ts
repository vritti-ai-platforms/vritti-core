import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CustomersTableResponse } from '@/schemas/customers';
import { getCustomersTable } from '@/services/customers.service';
import { CUSTOMERS_TABLE_KEY } from './keys';

// Fetches customers table data
export function useCustomersTable(
  options?: Omit<UseQueryOptions<CustomersTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<CustomersTableResponse, AxiosError>({
    queryKey: [...CUSTOMERS_TABLE_KEY],
    queryFn: getCustomersTable,
    ...options,
  });
}
