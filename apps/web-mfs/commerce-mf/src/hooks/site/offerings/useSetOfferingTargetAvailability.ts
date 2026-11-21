import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SetTargetAvailabilityData } from '@/schemas/offerings';
import { setTargetAvailability } from '@/services/site/offerings.service';

// Shows or hides a variant on one channel, then re-reads that channel's rows and the counts above them
export function useSetOfferingTargetAvailability(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SetTargetAvailabilityData>({
    mutationFn: setTargetAvailability,
    onSuccess: () => {
      invalidateWrites(queryClient, [Tables.catalogListingChannelExclusions]);
      options?.onSuccess?.();
    },
  });
}
