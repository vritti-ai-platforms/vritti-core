import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingsTableResponse } from '@/schemas/offerings';
import { getOfferingsTable } from '@/services/site/offerings.service';
import { OFFERINGS_TABLE_BY_CATALOG_KEY } from './keys';

// Fetches offerings table data for a catalog
export function useOfferingsTable(
  catalogId: string | null,
  options?: Omit<UseQueryOptions<OfferingsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<OfferingsTableResponse, AxiosError>({
    queryKey: OFFERINGS_TABLE_BY_CATALOG_KEY(catalogId ?? ''),
    queryFn: () => getOfferingsTable(catalogId as string),
    enabled: !!catalogId,
    ...options,
  });
}
