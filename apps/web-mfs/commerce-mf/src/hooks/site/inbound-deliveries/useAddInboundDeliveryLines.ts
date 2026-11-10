import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import type { AddInboundDeliveryLinesPayload } from '@/schemas/inbound-deliveries';
import { addInboundDeliveryLines } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERIES_TABLE_KEY, INBOUND_DELIVERY_KEY } from './keys';

// Puts purchase order lines on a delivery in one batch
export function useAddInboundDeliveryLines(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, AddInboundDeliveryLinesPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, AddInboundDeliveryLinesPayload>({
    ...options,
    mutationFn: addInboundDeliveryLines,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERY_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
