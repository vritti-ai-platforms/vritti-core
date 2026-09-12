import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { updateAppChannel } from '@/services/legal-entity/app-catalog-channels.service';
import { APP_CHANNEL_KEY } from './keys';

type Variables = { channelId: string; catalogId: string };

export function useUpdateAppChannel(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    ...options,
    mutationFn: updateAppChannel,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: APP_CHANNEL_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
