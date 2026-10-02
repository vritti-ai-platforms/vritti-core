import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteChannel } from '@/services/legal-entity/catalog-channels.service';
import { CATALOG_CHANNELS_KEY } from './keys';

export function useDeleteChannel(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: deleteChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATALOG_CHANNELS_KEY });
      options?.onSuccess?.();
    },
  });
}
