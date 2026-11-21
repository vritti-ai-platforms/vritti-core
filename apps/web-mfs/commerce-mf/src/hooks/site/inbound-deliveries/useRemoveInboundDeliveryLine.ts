import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { InboundDeliveryLineRef } from '@/schemas/inbound-deliveries';
import { removeInboundDeliveryLine } from '@/services/site/inbound-deliveries.service';

// Takes a line off a delivery
export function useRemoveInboundDeliveryLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, InboundDeliveryLineRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, InboundDeliveryLineRef>({
    ...options,
    mutationFn: removeInboundDeliveryLine,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inboundDeliveryLines, Tables.inboundDeliveries]);
      options?.onSuccess?.(...args);
    },
  });
}
