import { useQuery } from '@tanstack/react-query';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getChannelCurrencies } from '@/services/organization/catalog-channels.service';
import { CHANNEL_CURRENCIES_KEY } from './keys';

export function useChannelCurrencies(channelId: string) {
  const { available } = usePermission(ORG_CATALOG_CHANNELS.listings);
  return useQuery<string[], AxiosError>({
    queryKey: CHANNEL_CURRENCIES_KEY(channelId),
    queryFn: () => getChannelCurrencies(channelId),
    enabled: available && Boolean(channelId),
  });
}
