import { useQuery } from '@tanstack/react-query';
import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ChannelItemsTableResponse } from '@/schemas/catalog-channels';
import { getChannelItems } from '@/services/legal-entity/catalog-channels.service';
import { CHANNEL_ITEMS_KEY } from './keys';

export function useChannelItems(channelId: string) {
  const { available } = usePermission(LE_CATALOG_CHANNELS.view);
  return useQuery<ChannelItemsTableResponse, AxiosError>({
    queryKey: CHANNEL_ITEMS_KEY(channelId),
    queryFn: () => getChannelItems(channelId),
    enabled: available && Boolean(channelId),
  });
}
