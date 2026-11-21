import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { PurchaseOrderItemRef } from '@/schemas/purchase-orders';
import { removePurchaseOrderItem } from '@/services/site/purchase-orders.service';

// Removes a line from a purchase order
export function useRemovePurchaseOrderItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, PurchaseOrderItemRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, PurchaseOrderItemRef>({
    ...options,
    mutationFn: removePurchaseOrderItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrderItems, Tables.purchaseOrders]);
      options?.onSuccess?.(...args);
    },
  });
}
