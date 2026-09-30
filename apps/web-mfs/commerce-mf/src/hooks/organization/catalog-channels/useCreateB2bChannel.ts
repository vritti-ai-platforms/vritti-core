import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type CreateB2bChannelPayload, createB2bChannel } from '@/services/organization/catalog-channels.service';
import { CHANNELS_SCREEN_KEY } from './keys';

export function useCreateB2bChannel(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<unknown>, AxiosError, CreateB2bChannelPayload>({
    mutationFn: createB2bChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_SCREEN_KEY });
      options?.onSuccess?.();
    },
  });
}
