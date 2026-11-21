import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateInboundDeliveryPayload } from '@/schemas/inbound-deliveries';
import { updateInboundDelivery } from '@/services/site/inbound-deliveries.service';

// Updates a delivery's details; its purchase order lines follow its expected date
export function useUpdateInboundDelivery(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateInboundDeliveryPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateInboundDeliveryPayload>({
    ...options,
    mutationFn: updateInboundDelivery,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inboundDeliveries]);
      options?.onSuccess?.(...args);
    },
  });
}
