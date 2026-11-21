import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CatalogCounts } from '@/schemas/catalogs';
import { getCatalogCounts } from '@/services/organization/catalogs.service';
import { CATALOG_COUNTS_KEY } from './keys';

// Fetches how many channels, listings and currencies a catalog has, one per tab; under the catalog's key, so whatever
// refreshes the catalog refreshes them
export function useCatalogCounts(id: string) {
  return useQuery<CatalogCounts, AxiosError>({
    queryKey: CATALOG_COUNTS_KEY(id),
    queryFn: () => getCatalogCounts(id),
  });
}
