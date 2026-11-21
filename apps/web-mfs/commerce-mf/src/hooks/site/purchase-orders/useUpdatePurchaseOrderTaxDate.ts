import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdatePurchaseOrderTaxDatePayload } from '@/schemas/purchase-orders';
import { updatePurchaseOrderTaxDate } from '@/services/site/purchase-orders.service';

// Sets a purchase order's tax date; the lines that follow it move with it
export function useUpdatePurchaseOrderTaxDate(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseOrderTaxDatePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseOrderTaxDatePayload>({
    ...options,
    mutationFn: updatePurchaseOrderTaxDate,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders, Tables.purchaseOrderItems]);
      options?.onSuccess?.(...args);
    },
  });
}
