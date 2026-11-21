import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deletePurchaseOrder } from '@/services/site/purchase-orders.service';

// Deletes a draft purchase order
export function useDeletePurchaseOrder(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deletePurchaseOrder,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders, Tables.purchaseOrderItems]);
      options?.onSuccess?.(...args);
    },
  });
}
