import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteInboundDelivery } from '@/services/site/inbound-deliveries.service';

// Deletes a delivery; its purchase order lines become editable again
export function useDeleteInboundDelivery(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteInboundDelivery,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.inboundDeliveries, Tables.inboundDeliveryLines]);
      options?.onSuccess?.(...args);
    },
  });
}
