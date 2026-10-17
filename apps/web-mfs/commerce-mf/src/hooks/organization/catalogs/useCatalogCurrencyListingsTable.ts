import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CatalogListingsTableResponse } from '@/schemas/catalogs';
import { getCatalogCurrencyListingsTable } from '@/services/organization/catalogs.service';
import { CATALOG_CURRENCY_LISTINGS_TABLE_KEY } from './keys';

export function useCatalogCurrencyListingsTable(
  catalogId: string,
  currencyCode: string,
  options?: Omit<UseQueryOptions<CatalogListingsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_CATALOGS.prices.view);
  return useQuery<CatalogListingsTableResponse, AxiosError>({
    queryKey: CATALOG_CURRENCY_LISTINGS_TABLE_KEY(catalogId, currencyCode),
    queryFn: () => getCatalogCurrencyListingsTable({ catalogId, currencyCode }),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
