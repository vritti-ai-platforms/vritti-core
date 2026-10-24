import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { createChannelPages } from '@/services/legal-entity/offerings.service';
import { CHANNEL_VARIANTS_KEY } from './keys';

// Creates pages on one channel's storefront, then re-reads that channel's rows
export function useCreateChannelPages(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { offeringId: string; targetId: string; variantCodes: string[] }>({
    mutationFn: createChannelPages,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_VARIANTS_KEY(variables.offeringId, variables.targetId) });
      options?.onSuccess?.();
    },
  });
}
