import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { setAppChannelItemVisibility } from '@/services/organization/app-catalog-channels.service';
import { APP_CHANNEL_ITEMS_KEY, APP_CHANNEL_KEY } from './keys';

type Variables = { channelId: string; listingId: string; sellsHere: boolean };

export function useSetAppChannelItemVisibility(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: setAppChannelItemVisibility,
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({ queryKey: APP_CHANNEL_ITEMS_KEY(variables.channelId) });
      queryClient.invalidateQueries({ queryKey: APP_CHANNEL_KEY });
      options?.onSuccess?.(data, variables, ...rest);
    },
  });
}
