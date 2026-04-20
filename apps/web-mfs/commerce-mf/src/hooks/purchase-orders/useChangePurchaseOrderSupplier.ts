import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { changePurchaseOrderSupplier } from '@/services/purchase-orders.service';
import { PURCHASE_ORDER_KEY } from './usePurchaseOrder';
import { PURCHASE_ORDER_ITEMS_KEY } from './usePurchaseOrderItems';
import { PURCHASE_ORDER_ITEMS_TABLE_KEY } from './usePurchaseOrderItemsTable';
import { PURCHASE_ORDERS_TABLE_KEY } from './usePurchaseOrdersTable';

export function useChangePurchaseOrderSupplier(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, { id: string; supplierId: string }>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, { id: string; supplierId: string }>({
    ...options,
    mutationFn: changePurchaseOrderSupplier,
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
