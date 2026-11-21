import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingCounts } from '@/schemas/offerings';
import { getOfferingCounts } from '@/services/organization/offerings.service';
import { OFFERING_COUNTS_KEY } from './keys';

// Fetches how many dimensions, attributes and variants an offering has, one per tab; under the offerings key, so every
// write in this folder refreshes them
export function useOfferingCounts(id: string) {
  return useQuery<OfferingCounts, AxiosError>({
    queryKey: OFFERING_COUNTS_KEY(id),
    queryFn: () => getOfferingCounts(id),
  });
}
