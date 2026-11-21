import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { type UpsertChannelPayload, upsertChannel } from '@/services/organization/catalog-channels.service';

export function useUpsertChannel(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<unknown>, AxiosError, UpsertChannelPayload>({
    mutationFn: upsertChannel,
    onSuccess: () => {
      invalidateWrites(queryClient, [Tables.catalogChannels]);
      options?.onSuccess?.();
    },
  });
}
