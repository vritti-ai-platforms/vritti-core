import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASE_ORDERS_KEY } from '@/hooks/site/purchase-orders/keys';
import { deleteInboundDelivery } from '@/services/site/inbound-deliveries.service';
import { INBOUND_DELIVERIES_TABLE_KEY } from './keys';

// Deletes a delivery; its purchase order lines become editable again
export function useDeleteInboundDelivery(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteInboundDelivery,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
