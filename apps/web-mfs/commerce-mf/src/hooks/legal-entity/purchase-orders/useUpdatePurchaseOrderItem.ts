import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdatePurchaseOrderItemPayload } from '@/schemas/purchase-orders';
import { updatePurchaseOrderItem } from '@/services/legal-entity/purchase-orders.service';

// Updates a line of a purchase order
export function useUpdatePurchaseOrderItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseOrderItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseOrderItemPayload>({
    ...options,
    mutationFn: updatePurchaseOrderItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrderItems, Tables.purchaseOrders]);
      options?.onSuccess?.(...args);
    },
  });
}
