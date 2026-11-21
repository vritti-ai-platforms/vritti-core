import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ChangePurchaseOrderExchangeRatePayload } from '@/schemas/purchase-orders';
import { changePurchaseOrderExchangeRate } from '@/services/site/purchase-orders.service';

// Changes a foreign-currency purchase order's exchange rate
export function useChangePurchaseOrderExchangeRate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ChangePurchaseOrderExchangeRatePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ChangePurchaseOrderExchangeRatePayload>({
    ...options,
    mutationFn: changePurchaseOrderExchangeRate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders]);
      options?.onSuccess?.(...args);
    },
  });
}
