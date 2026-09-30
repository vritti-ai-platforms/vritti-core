import { useQuery } from '@tanstack/react-query';
import { SITE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ChannelScreenEntryData } from '@/schemas/catalog-channels';
import { getChannelsScreen } from '@/services/site/catalog-channels.service';
import { CHANNELS_SCREEN_KEY } from './keys';

export function useChannelsScreen() {
  const { available } = usePermission(SITE_CATALOG_CHANNELS.view);
  return useQuery<ChannelScreenEntryData[], AxiosError>({
    queryKey: CHANNELS_SCREEN_KEY,
    queryFn: getChannelsScreen,
    enabled: available,
  });
}
