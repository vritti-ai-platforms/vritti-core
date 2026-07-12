import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingVariant } from '@/schemas/offerings';
import { listVariants } from '@/site/services/offerings.service';
import { OFFERING_VARIANTS_KEY } from './keys';

// Fetches variants for an offering
export function useOfferingVariants(
  catalogId: string,
  offeringId: string | null,
  options?: Omit<UseQueryOptions<OfferingVariant[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<OfferingVariant[], AxiosError>({
    queryKey: OFFERING_VARIANTS_KEY(catalogId, offeringId ?? ''),
    queryFn: () => listVariants({ catalogId, offeringId: offeringId as string }),
    enabled: !!offeringId,
    ...options,
  });
}
