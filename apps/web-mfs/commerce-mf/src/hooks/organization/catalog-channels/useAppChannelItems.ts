import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ChannelItemsTableResponse } from '@/schemas/catalog-channels';
import { getAppChannelItems } from '@/services/organization/app-catalog-channels.service';
import { APP_CHANNEL_ITEMS_KEY } from './keys';

export function useAppChannelItems(channelId: string) {
  return useQuery<ChannelItemsTableResponse, AxiosError>({
    queryKey: APP_CHANNEL_ITEMS_KEY(channelId),
    queryFn: () => getAppChannelItems(channelId),
    enabled: Boolean(channelId),
  });
}
