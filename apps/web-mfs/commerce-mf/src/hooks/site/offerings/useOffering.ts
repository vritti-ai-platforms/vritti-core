import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingData } from '@/schemas/offerings';
import { getOffering } from '@/services/site/offerings.service';
import { OFFERINGS_KEY } from './keys';
import type { SuspenseOptions } from './options';

// Suspense-backed: the detail route renders a skeleton at its boundary, so the page never handles a loading state and
// `data` is always defined
export function useOffering(id: string, options?: SuspenseOptions<OfferingData>) {
  return useSuspenseQuery<OfferingData, AxiosError>({
    queryKey: [...OFFERINGS_KEY, id],
    queryFn: () => getOffering(id),
    ...options,
  });
}
