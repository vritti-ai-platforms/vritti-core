import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxGroupData } from '@/schemas/tax-groups';
import { getTaxGroup } from '@/services/tax-groups.service';
import { TAX_GROUP_KEY } from './keys';

type UseTaxGroupOptions = Omit<UseQueryOptions<TaxGroupData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>;

// Fetches one tax group by ID
export function useTaxGroup(id: string | null, options?: UseTaxGroupOptions) {
  return useQuery<TaxGroupData, AxiosError>({
    queryKey: [...TAX_GROUP_KEY, id],
    queryFn: () => getTaxGroup(id as string),
    enabled: !!id,
    ...options,
  });
}
