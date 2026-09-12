import { useQuery } from '@tanstack/react-query';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ChannelOverviewData } from '@/schemas/catalog-channels';
import { getCatalogChannelsOverview } from '@/services/site/catalog-channels.service';
import { CATALOG_CHANNELS_KEY } from './keys';

export function useCatalogChannelsOverview() {
  const { available } = usePermission(ORG_CATALOG_CHANNELS.view);
  return useQuery<ChannelOverviewData[], AxiosError>({
    queryKey: CATALOG_CHANNELS_KEY,
    queryFn: getCatalogChannelsOverview,
    enabled: available,
  });
}
