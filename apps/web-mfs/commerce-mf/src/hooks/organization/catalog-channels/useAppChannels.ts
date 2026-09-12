import { useQuery } from '@tanstack/react-query';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CatalogChannelsTableResponse } from '@/schemas/catalog-channels';
import { getAppChannelsTable } from '@/services/organization/app-catalog-channels.service';
import { APP_CHANNEL_KEY } from './keys';

export function useAppChannels() {
  const { available } = usePermission(ORG_CATALOG_CHANNELS.view);
  return useQuery<CatalogChannelsTableResponse, AxiosError>({
    queryKey: APP_CHANNEL_KEY,
    queryFn: getAppChannelsTable,
    enabled: available,
  });
}
