import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { PURCHASES_KEY } from '@/hooks/site/purchases/keys';
import type { UpdatePurchaseOrderStatusPayload } from '@/schemas/purchase-orders';
import { updatePurchaseOrderStatus } from '@/services/site/purchase-orders.service';
import { PURCHASE_ORDER_KEY, PURCHASE_ORDERS_TABLE_KEY } from './keys';

// Moves a purchase order along its manual workflow
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
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
