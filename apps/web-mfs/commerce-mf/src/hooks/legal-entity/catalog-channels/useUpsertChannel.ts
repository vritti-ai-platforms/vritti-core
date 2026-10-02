import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { type UpsertChannelPayload, upsertChannel } from '@/services/legal-entity/catalog-channels.service';
import { CATALOG_CHANNELS_KEY } from './keys';

export function useUpsertChannel(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<unknown>, AxiosError, UpsertChannelPayload>({
    mutationFn: upsertChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_CHANNELS_KEY });
      options?.onSuccess?.();
    },
  });
}
