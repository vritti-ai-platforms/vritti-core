import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingModifierGroup } from '@/schemas/offerings';
import { listOfferingModifiers } from '@/services/offerings.service';
import { OFFERING_MODIFIERS_KEY } from './keys';

// Fetches assigned modifier groups for an offering
export function useOfferingModifiers(
  catalogId: string,
  offeringId: string | null,
  options?: Omit<UseQueryOptions<OfferingModifierGroup[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<OfferingModifierGroup[], AxiosError>({
    queryKey: OFFERING_MODIFIERS_KEY(catalogId, offeringId ?? ''),
    queryFn: () => listOfferingModifiers({ catalogId, offeringId: offeringId as string }),
    enabled: !!offeringId,
    ...options,
  });
}
