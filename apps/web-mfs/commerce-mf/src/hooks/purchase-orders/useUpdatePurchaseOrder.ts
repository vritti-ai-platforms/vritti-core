import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseOrderData } from '@/schemas/purchase-orders';
import { type UpdatePurchaseOrderPayload, updatePurchaseOrder } from '@/services/purchase-orders.service';
import { PURCHASE_ORDER_KEY } from './usePurchaseOrder';
import { PURCHASE_ORDER_ITEMS_KEY } from './usePurchaseOrderItems';
import { PURCHASE_ORDER_ITEMS_TABLE_KEY } from './usePurchaseOrderItemsTable';
import { PURCHASE_ORDERS_TABLE_KEY } from './usePurchaseOrdersTable';

// Updates a purchase order and invalidates table + detail
export function useUpdatePurchaseOrder(
  options?: Omit<
    UseMutationOptions<PurchaseOrderData, AxiosError, { id: string; data: UpdatePurchaseOrderPayload }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<PurchaseOrderData, AxiosError, { id: string; data: UpdatePurchaseOrderPayload }>({
    ...options,
    mutationFn: updatePurchaseOrder,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_TABLE_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
