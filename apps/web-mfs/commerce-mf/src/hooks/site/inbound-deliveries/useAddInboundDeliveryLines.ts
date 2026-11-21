import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddInboundDeliveryLinesPayload } from '@/schemas/inbound-deliveries';
import { addInboundDeliveryLines } from '@/services/site/inbound-deliveries.service';

// Puts purchase order lines on a delivery in one batch
export function useAddInboundDeliveryLines(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, AddInboundDeliveryLinesPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, AddInboundDeliveryLinesPayload>({
    ...options,
    mutationFn: addInboundDeliveryLines,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inboundDeliveryLines, Tables.inboundDeliveries]);
      options?.onSuccess?.(...args);
    },
  });
}
