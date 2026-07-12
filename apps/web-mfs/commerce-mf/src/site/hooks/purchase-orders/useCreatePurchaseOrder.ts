import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { PurchaseOrderData } from '@/schemas/purchase-orders';
import { type CreatePurchaseOrderPayload, createPurchaseOrder } from '@/site/services/purchase-orders.service';
import { PURCHASE_ORDERS_TABLE_KEY } from './keys';

// Creates a new purchase order and invalidates the table
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
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
