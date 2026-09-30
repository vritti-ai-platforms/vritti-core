import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { LE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CatalogListingsTableResponse } from '@/schemas/catalogs';
import { getCatalogListingsTable } from '@/services/legal-entity/catalogs.service';
import { CATALOG_LISTINGS_TABLE_KEY } from './keys';

export function useCatalogListingsTable(
  catalogId: string,
  options?: Omit<UseQueryOptions<CatalogListingsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_CATALOGS.listings.view);
  return useQuery<CatalogListingsTableResponse, AxiosError>({
    queryKey: CATALOG_LISTINGS_TABLE_KEY(catalogId),
    queryFn: () => getCatalogListingsTable(catalogId),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
