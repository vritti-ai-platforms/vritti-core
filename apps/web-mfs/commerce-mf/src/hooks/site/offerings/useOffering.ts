import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingDetail } from '@/schemas/offerings';
import { getOffering } from '@/services/site/offerings.service';
import { OFFERING_DETAIL_KEY } from './keys';

// Fetches full offering detail by ID (suspends while loading)
export function useOffering(catalogId: string, offeringId: string) {
  return useSuspenseQuery<OfferingDetail, AxiosError>({
    queryKey: OFFERING_DETAIL_KEY(catalogId, offeringId),
    queryFn: () => getOffering({ catalogId, offeringId }),
  });
}
