import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CatalogTableResponse } from '@/schemas/catalogs';
import { getCatalogsTable } from '@/site/services/catalogs.service';
import { CATALOGS_TABLE_KEY } from './keys';

export function useCatalogsTable(
  options?: Omit<UseQueryOptions<CatalogTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<CatalogTableResponse, AxiosError>({
    queryKey: [...CATALOGS_TABLE_KEY],
    queryFn: getCatalogsTable,
    ...options,
  });
}
