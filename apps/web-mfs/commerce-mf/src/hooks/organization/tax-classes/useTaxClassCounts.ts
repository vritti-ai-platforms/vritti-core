import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxClassCounts } from '@/schemas/tax-classes';
import { getTaxClassCounts } from '@/services/organization/tax-classes.service';
import { TAX_CLASS_COUNTS_KEY } from './keys';

// Fetches how many group mappings a tax class has, one per tab; under the class's key, so whatever refreshes the class
// refreshes them
export function useTaxClassCounts(id: string) {
  return useQuery<TaxClassCounts, AxiosError>({
    queryKey: TAX_CLASS_COUNTS_KEY(id),
    queryFn: () => getTaxClassCounts(id),
  });
}
