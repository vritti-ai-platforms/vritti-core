import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import type { UpdateInboundDeliveryLinePayload } from '@/schemas/inbound-deliveries';
import { updateInboundDeliveryLine } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERIES_TABLE_KEY, INBOUND_DELIVERY_KEY } from './keys';

// Changes the quantity of a delivery line
export function useUpdateInboundDeliveryLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateInboundDeliveryLinePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateInboundDeliveryLinePayload>({
    ...options,
    mutationFn: updateInboundDeliveryLine,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERY_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
