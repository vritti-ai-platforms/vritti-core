import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxGroupsTableResponse } from '@/schemas/tax-groups';
import { getTaxGroupsTable } from '@/services/tax-groups.service';
import { TAX_GROUPS_TABLE_KEY } from './keys';

type UseTaxGroupsTableOptions = Omit<UseQueryOptions<TaxGroupsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>;

// Fetches the current page of tax groups for the data table (server-state, BU-scoped via RLS)
export function useTaxGroupsTable(options?: UseTaxGroupsTableOptions) {
  return useQuery<TaxGroupsTableResponse, AxiosError>({
    queryKey: TAX_GROUPS_TABLE_KEY,
    queryFn: getTaxGroupsTable,
    ...options,
  });
}
