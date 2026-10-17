import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CatalogCurrencyData } from '@/schemas/catalogs';
import { getCatalogCurrencies } from '@/services/organization/catalogs.service';
import { CATALOG_CURRENCIES_KEY } from './keys';

export function useCatalogCurrencies(
  catalogId: string,
  options?: Omit<UseQueryOptions<CatalogCurrencyData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_CATALOGS.currencies.view);
  return useQuery<CatalogCurrencyData[], AxiosError>({
    queryKey: CATALOG_CURRENCIES_KEY(catalogId),
    queryFn: () => getCatalogCurrencies(catalogId),
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
