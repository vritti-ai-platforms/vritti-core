import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteChannel } from '@/services/site/catalog-channels.service';

export function useDeleteChannel(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: deleteChannel,
    onSuccess: () => {
      invalidateWrites(queryClient, [Tables.catalogChannels, Tables.catalogListingChannelExclusions]);
      options?.onSuccess?.();
    },
  });
}
