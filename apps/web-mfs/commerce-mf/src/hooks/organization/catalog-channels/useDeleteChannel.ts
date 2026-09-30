import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteChannel } from '@/services/organization/catalog-channels.service';
import { CHANNELS_SCREEN_KEY } from './keys';

export function useDeleteChannel(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_SCREEN_KEY });
      options?.onSuccess?.();
    },
  });
}
