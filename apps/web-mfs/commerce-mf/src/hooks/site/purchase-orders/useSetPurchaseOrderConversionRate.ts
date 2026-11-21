import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SetPurchaseOrderConversionRatePayload } from '@/schemas/purchase-orders';
import { setPurchaseOrderConversionRate } from '@/services/site/purchase-orders.service';

// Sets a purchase order's rate for another of the supplier's currencies
export function useSetPurchaseOrderConversionRate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetPurchaseOrderConversionRatePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SetPurchaseOrderConversionRatePayload>({
    ...options,
    mutationFn: setPurchaseOrderConversionRate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders, Tables.purchaseOrderItems]);
      options?.onSuccess?.(...args);
    },
  });
}
