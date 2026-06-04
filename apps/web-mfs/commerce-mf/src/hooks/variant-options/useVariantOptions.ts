import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { VariantOption } from '@/schemas/variant-options';
import { listVariantOptions } from '@/services/variant-options.service';
import { VARIANT_OPTIONS_BY_CATALOG_KEY } from './keys';

// Fetches the variant options (dimensions) defined on a catalog
export function useVariantOptions(
  catalogId: string | null,
  options?: Omit<UseQueryOptions<VariantOption[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<VariantOption[], AxiosError>({
    queryKey: VARIANT_OPTIONS_BY_CATALOG_KEY(catalogId ?? ''),
    queryFn: () => listVariantOptions(catalogId as string),
    enabled: !!catalogId,
    ...options,
  });
}
