import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import type { UpdateInboundDeliveryStatusPayload } from '@/schemas/inbound-deliveries';
import { updateInboundDeliveryStatus } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERIES_TABLE_KEY, INBOUND_DELIVERY_KEY } from './keys';

// Moves a delivery along its manual workflow or cancels it
export function useUpdateInboundDeliveryStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateInboundDeliveryStatusPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateInboundDeliveryStatusPayload>({
    ...options,
    mutationFn: updateInboundDeliveryStatus,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERY_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
