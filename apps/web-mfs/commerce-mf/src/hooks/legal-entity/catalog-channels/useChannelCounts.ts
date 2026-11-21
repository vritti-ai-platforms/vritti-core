import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CatalogChannelCounts } from '@/schemas/catalog-channels';
import { getChannelCounts } from '@/services/legal-entity/catalog-channels.service';
import { CHANNEL_COUNTS_KEY } from './keys';

// Fetches how many listings and currencies a channel carries, one per tab; under the channels key, so every write in
// this folder refreshes them
export function useChannelCounts(channelId: string) {
  return useQuery<CatalogChannelCounts, AxiosError>({
    queryKey: CHANNEL_COUNTS_KEY(channelId),
    queryFn: () => getChannelCounts(channelId),
  });
}
