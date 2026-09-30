import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { updateChannel } from '@/services/organization/catalog-channels.service';
import { CHANNELS_SCREEN_KEY } from './keys';

export function useUpdateChannel(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { channelId: string; catalogId: string }>({
    mutationFn: updateChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_SCREEN_KEY });
      options?.onSuccess?.();
    },
  });
}
