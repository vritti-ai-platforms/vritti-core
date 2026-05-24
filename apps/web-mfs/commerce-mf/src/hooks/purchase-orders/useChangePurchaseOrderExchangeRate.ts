import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import {
  type ChangePurchaseOrderExchangeRatePayload,
  changePurchaseOrderExchangeRate,
} from '@/services/purchase-orders.service';
import { PURCHASE_ORDER_KEY, PURCHASE_ORDERS_TABLE_KEY } from './keys';

export function useChangePurchaseOrderExchangeRate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ChangePurchaseOrderExchangeRatePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, ChangePurchaseOrderExchangeRatePayload>({
    ...options,
    mutationFn: changePurchaseOrderExchangeRate,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
