import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingVariantCounts } from '@/schemas/offerings';
import { getVariantCounts } from '@/services/organization/offerings.service';
import { VARIANT_COUNTS_KEY } from './keys';

// Fetches how many bill-of-materials lines a variant has, one per tab; under the offerings key, so every write in this
// folder refreshes them
export function useOfferingVariantCounts(variantId: string) {
  return useQuery<OfferingVariantCounts, AxiosError>({
    queryKey: VARIANT_COUNTS_KEY(variantId),
    queryFn: () => getVariantCounts(variantId),
  });
}
