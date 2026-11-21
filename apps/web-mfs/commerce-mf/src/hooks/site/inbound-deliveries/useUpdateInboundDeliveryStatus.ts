import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateInboundDeliveryStatusPayload } from '@/schemas/inbound-deliveries';
import { updateInboundDeliveryStatus } from '@/services/site/inbound-deliveries.service';

// Moves a delivery along its manual workflow or cancels it
export function useUpdateInboundDeliveryStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateInboundDeliveryStatusPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateInboundDeliveryStatusPayload>({
    ...options,
    mutationFn: updateInboundDeliveryStatus,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inboundDeliveries]);
      options?.onSuccess?.(...args);
    },
  });
}
