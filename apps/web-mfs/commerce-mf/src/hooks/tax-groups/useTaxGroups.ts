import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxGroupData } from '@/schemas/tax-groups';
import { listTaxGroups } from '@/services/tax-groups.service';
import { TAX_GROUPS_KEY } from './keys';

type UseTaxGroupsOptions = Omit<UseQueryOptions<TaxGroupData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>;

// Fetches tax groups for the current BU context; buId is used for cache scoping.
export function useTaxGroups(buId: string | null, options?: UseTaxGroupsOptions) {
  return useQuery<TaxGroupData[], AxiosError>({
    queryKey: [...TAX_GROUPS_KEY, buId],
    queryFn: listTaxGroups,
    enabled: !!buId,
    ...options,
  });
}
