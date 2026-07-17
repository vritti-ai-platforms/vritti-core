import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxClassesTableResponse } from '@/schemas/tax-classes';
import { getTaxClassesTable } from '@/services/organization/tax-classes.service';
import { TAX_CLASSES_TABLE_KEY } from './keys';

export function useTaxClassesTable(
  options?: Omit<UseQueryOptions<TaxClassesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TaxClassesTableResponse, AxiosError>({
    queryKey: [...TAX_CLASSES_TABLE_KEY],
    queryFn: getTaxClassesTable,
    ...options,
  });
}
