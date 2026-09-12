import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CatalogData } from '@/schemas/catalogs';
import { getCatalog } from '@/services/organization/catalogs.service';
import { CATALOG_KEY } from './keys';

export function useCatalog(id: string) {
  return useSuspenseQuery<CatalogData, AxiosError>({
    queryKey: CATALOG_KEY(id),
    queryFn: () => getCatalog(id),
  });
}
