import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CatalogChannelsTableResponse } from '@/schemas/catalog-channels';
import { getCatalogChannelsTable } from '@/services/organization/catalog-channels.service';
import { CATALOG_CHANNELS_TABLE_KEY } from './keys';

export function useCatalogChannelsTable(
  options?: Omit<UseQueryOptions<CatalogChannelsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_CATALOG_CHANNELS.view);
  return useQuery<CatalogChannelsTableResponse, AxiosError>({
    queryKey: [...CATALOG_CHANNELS_TABLE_KEY],
    queryFn: getCatalogChannelsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
