import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { PurchaseOrderData } from '@/schemas/purchase-orders';
import { type AddPurchaseOrderItemPayload, addPurchaseOrderItem } from '@/services/purchase-orders.service';
import {
  PURCHASE_ORDER_ITEMS_IDS_KEY,
  PURCHASE_ORDER_ITEMS_TABLE_KEY,
  PURCHASE_ORDER_KEY,
  PURCHASE_ORDERS_TABLE_KEY,
} from './keys';

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
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_IDS_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_TABLE_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
