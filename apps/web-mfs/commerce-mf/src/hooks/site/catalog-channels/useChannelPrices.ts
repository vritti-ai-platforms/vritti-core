import { useQuery } from '@tanstack/react-query';
import { SITE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { ChannelPricesTableResponse } from '@/schemas/catalog-channels';
import { getChannelPrices } from '@/services/site/catalog-channels.service';
import { CHANNEL_PRICES_KEY } from './keys';

export function useChannelPrices(channelId: string, currencyCode: string) {
  const { available } = usePermission(SITE_CATALOG_CHANNELS.listings);
  return useQuery<ChannelPricesTableResponse, AxiosError>({
    queryKey: CHANNEL_PRICES_KEY(channelId, currencyCode),
    queryFn: () => getChannelPrices({ channelId, currencyCode }),
    enabled: available && Boolean(channelId) && Boolean(currencyCode),
  });
}
