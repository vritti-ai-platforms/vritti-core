import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type CreateAppChannelPayload, createAppChannel } from '@/services/legal-entity/catalog-channels.service';
import { CHANNELS_SCREEN_KEY } from './keys';

export function useCreateAppChannel(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<unknown>, AxiosError, CreateAppChannelPayload>({
    mutationFn: createAppChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_SCREEN_KEY });
      options?.onSuccess?.();
    },
  });
}
