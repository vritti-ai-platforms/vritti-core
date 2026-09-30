import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { LE_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CatalogsTableResponse } from '@/schemas/catalogs';
import { getCatalogsTable } from '@/services/legal-entity/catalogs.service';
import { CATALOGS_TABLE_KEY } from './keys';

export function useCatalogsTable(
  options?: Omit<UseQueryOptions<CatalogsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(LE_CATALOGS.view);
  return useQuery<CatalogsTableResponse, AxiosError>({
    queryKey: [...CATALOGS_TABLE_KEY],
    queryFn: getCatalogsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
