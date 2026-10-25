import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SetTargetAvailabilityData } from '@/schemas/offerings';
import { setTargetAvailability } from '@/services/site/offerings.service';
import { CHANNEL_VARIANTS_KEY, OFFERING_CHANNELS_KEY } from './keys';

// Shows or hides a variant on one channel, then re-reads that channel's rows and the counts above them
export function useSetTargetAvailability(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SetTargetAvailabilityData>({
    mutationFn: setTargetAvailability,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CHANNEL_VARIANTS_KEY(variables.offeringId, variables.targetId) });
      queryClient.invalidateQueries({ queryKey: OFFERING_CHANNELS_KEY(variables.offeringId) });
      options?.onSuccess?.();
    },
  });
}
