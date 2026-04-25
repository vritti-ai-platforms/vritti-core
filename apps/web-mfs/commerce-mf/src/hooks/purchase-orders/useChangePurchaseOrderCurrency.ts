import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { changePurchaseOrderCurrency } from '@/services/purchase-orders.service';
import { PURCHASE_ORDERS_TABLE_KEY, PURCHASE_ORDER_KEY, PURCHASE_ORDER_ITEMS_IDS_KEY, PURCHASE_ORDER_ITEMS_TABLE_KEY } from './keys';

export function useChangePurchaseOrderCurrency(
  options?: Omit<
    UseMutationOptions<
      SuccessResponse,
      AxiosError,
      { id: string; currencyCode: string; conversionRate: number }
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<
    SuccessResponse,
    AxiosError,
    { id: string; currencyCode: string; conversionRate: number }
  >({
    ...options,
    mutationFn: changePurchaseOrderCurrency,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_TABLE_KEY(variables.id) });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_IDS_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
