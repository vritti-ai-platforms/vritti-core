import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type TaxGroupData, listTaxGroups } from '@/services/tax-groups.service';

type UseTaxGroupsOptions = Omit<UseQueryOptions<TaxGroupData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>;

// Fetches tax groups for a business unit
export function useTaxGroups(buId: string | null, options?: UseTaxGroupsOptions) {
  return useQuery<TaxGroupData[], AxiosError>({
    queryKey: ['tax-groups', buId],
    queryFn: () => listTaxGroups(buId!),
    enabled: !!buId,
    ...options,
  });
}
