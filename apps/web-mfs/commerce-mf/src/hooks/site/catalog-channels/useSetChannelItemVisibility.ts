import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { setChannelItemVisibility } from '@/services/site/catalog-channels.service';
import { CATALOG_CHANNELS_KEY, CHANNEL_CURRENCIES_KEY, CHANNEL_ITEMS_KEY } from './keys';

type Variables = { channelId: string; listingId: string; availableHere: boolean; currencyCode?: string };

export function useSetChannelItemVisibility(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    mutationFn: setChannelItemVisibility,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CATALOG_CHANNELS_KEY });
      queryClient.invalidateQueries({ queryKey: CHANNEL_ITEMS_KEY(variables.channelId) });
      // An outright withdrawal silences every currency, so the per-currency tables refetch too
      queryClient.invalidateQueries({ queryKey: CHANNEL_CURRENCIES_KEY(variables.channelId) });
      options?.onSuccess?.();
    },
  });
}
