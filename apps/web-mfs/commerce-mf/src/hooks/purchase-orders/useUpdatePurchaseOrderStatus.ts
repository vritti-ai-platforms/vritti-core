import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { updatePurchaseOrderStatus } from '@/services/purchase-orders.service';
import { PURCHASE_ORDER_KEY, PURCHASE_ORDERS_TABLE_KEY } from './keys';

export interface UpdatePurchaseOrderStatusPayload {
  id: string;
  status: string;
}

// Updates a purchase order status and invalidates table + detail
export function useUpdatePurchaseOrderStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseOrderStatusPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseOrderStatusPayload>({
    ...options,
    mutationFn: updatePurchaseOrderStatus,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
