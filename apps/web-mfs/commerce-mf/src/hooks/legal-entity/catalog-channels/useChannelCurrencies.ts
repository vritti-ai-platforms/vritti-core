import { useQuery } from '@tanstack/react-query';
import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getChannelCurrencies } from '@/services/legal-entity/catalog-channels.service';
import { CHANNEL_CURRENCIES_KEY } from './keys';

export function useChannelCurrencies(channelId: string) {
  const { available } = usePermission(LE_CATALOG_CHANNELS.listings);
  return useQuery<string[], AxiosError>({
    queryKey: CHANNEL_CURRENCIES_KEY(channelId),
    queryFn: () => getChannelCurrencies(channelId),
    enabled: available && Boolean(channelId),
  });
}
