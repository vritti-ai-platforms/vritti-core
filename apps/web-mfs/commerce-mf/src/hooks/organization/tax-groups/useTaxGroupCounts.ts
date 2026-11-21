import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxGroupCounts } from '@/schemas/tax-groups';
import { getTaxGroupCounts } from '@/services/organization/tax-groups.service';
import { TAX_GROUP_COUNTS_KEY } from './keys';

// Fetches how many rates and class mappings a tax group has, one per tab; under the group's key, so whatever refreshes
// the group refreshes them
export function useTaxGroupCounts(id: string) {
  return useQuery<TaxGroupCounts, AxiosError>({
    queryKey: TAX_GROUP_COUNTS_KEY(id),
    queryFn: () => getTaxGroupCounts(id),
  });
}
