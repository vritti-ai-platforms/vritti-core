import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { completePurchaseOrderDelivery } from '@/services/site/purchase-orders.service';

// Closes a purchase order short
export function useCompletePurchaseOrderDelivery(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: completePurchaseOrderDelivery,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders, Tables.purchaseOrderItems]);
      options?.onSuccess?.(...args);
    },
  });
}
