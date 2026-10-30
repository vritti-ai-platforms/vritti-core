import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import {
  type SetPurchaseOrderConversionRatePayload,
  setPurchaseOrderConversionRate,
} from '@/services/site/purchase-orders.service';
import { PURCHASE_ORDER_KEY, PURCHASE_ORDERS_TABLE_KEY } from './keys';

// Sets a PO's conversion rate for one currency; the PO, its re-converted lines and its total refresh
export function useSetPurchaseOrderConversionRate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetPurchaseOrderConversionRatePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, SetPurchaseOrderConversionRatePayload>({
    ...options,
    mutationFn: setPurchaseOrderConversionRate,
    onSuccess: (...args) => {
      const [, variables] = args;
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_KEY(variables.id) });
      options?.onSuccess?.(...args);
    },
  });
}
