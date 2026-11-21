import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setChannelItemVisibility } from '@/services/legal-entity/catalog-channels.service';

type Variables = { channelId: string; listingId: string; availableHere: boolean; currencyCode?: string };

export function useSetChannelItemVisibility(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Variables>({
    mutationFn: setChannelItemVisibility,
    onSuccess: () => {
      invalidateWrites(queryClient, [Tables.catalogListingChannelExclusions]);
      options?.onSuccess?.();
    },
  });
}
