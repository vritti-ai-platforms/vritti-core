import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import type { InboundDeliveryLineRef } from '@/schemas/inbound-deliveries';
import { removeInboundDeliveryLine } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERIES_TABLE_KEY, INBOUND_DELIVERY_KEY } from './keys';

// Takes a line off a delivery
export function useRemoveInboundDeliveryLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, InboundDeliveryLineRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, InboundDeliveryLineRef>({
    ...options,
    mutationFn: removeInboundDeliveryLine,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERY_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
