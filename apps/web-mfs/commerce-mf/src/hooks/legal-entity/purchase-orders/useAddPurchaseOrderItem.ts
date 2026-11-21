import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddPurchaseOrderItemPayload, PurchaseOrderData } from '@/schemas/purchase-orders';
import { addPurchaseOrderItem } from '@/services/legal-entity/purchase-orders.service';

// Adds a line to a purchase order
export function useAddPurchaseOrderItem(
  options?: Omit<
    UseMutationOptions<CreateResponse<PurchaseOrderData>, AxiosError, AddPurchaseOrderItemPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<PurchaseOrderData>, AxiosError, AddPurchaseOrderItemPayload>({
    ...options,
    mutationFn: addPurchaseOrderItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrderItems, Tables.purchaseOrders]);
      options?.onSuccess?.(...args);
    },
  });
}
