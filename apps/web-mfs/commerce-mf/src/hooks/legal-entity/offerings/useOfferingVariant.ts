import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingVariantData } from '@/schemas/offerings';
import { getVariant } from '@/services/legal-entity/offerings.service';
import { VARIANT_KEY } from './keys';
import type { SuspenseOptions } from './options';

// Suspense-backed: the variant route renders a skeleton at its boundary, so `data` is always defined
export function useOfferingVariant(variantId: string, options?: SuspenseOptions<OfferingVariantData>) {
  return useSuspenseQuery<OfferingVariantData, AxiosError>({
    queryKey: [...VARIANT_KEY(variantId)],
    queryFn: () => getVariant(variantId),
    ...options,
  });
}
