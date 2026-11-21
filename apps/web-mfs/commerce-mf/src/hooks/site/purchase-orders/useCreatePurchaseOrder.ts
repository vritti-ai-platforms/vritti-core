import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatePurchaseOrderPayload, PurchaseOrderData } from '@/schemas/purchase-orders';
import { createPurchaseOrder } from '@/services/site/purchase-orders.service';

// Creates a purchase order
export function useCreatePurchaseOrder(
  options?: Omit<
    UseMutationOptions<CreateResponse<PurchaseOrderData>, AxiosError, CreatePurchaseOrderPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<PurchaseOrderData>, AxiosError, CreatePurchaseOrderPayload>({
    ...options,
    mutationFn: createPurchaseOrder,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders]);
      options?.onSuccess?.(...args);
    },
  });
}
