import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type CatalogOption, getCatalogOptions } from '@/services/organization/catalogs.service';

export const CATALOG_OPTIONS_KEY = ['commerce', 'org', 'catalogs', 'options'] as const;

export function useCatalogOptions() {
  return useQuery<CatalogOption[], AxiosError>({
    queryKey: CATALOG_OPTIONS_KEY,
    queryFn: getCatalogOptions,
  });
}
