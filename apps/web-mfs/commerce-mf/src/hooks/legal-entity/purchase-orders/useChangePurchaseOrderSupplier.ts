import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ChangePurchaseOrderSupplierPayload } from '@/schemas/purchase-orders';
import { changePurchaseOrderSupplier } from '@/services/legal-entity/purchase-orders.service';

// Moves a draft purchase order to another supplier
export function useChangePurchaseOrderSupplier(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ChangePurchaseOrderSupplierPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ChangePurchaseOrderSupplierPayload>({
    ...options,
    mutationFn: changePurchaseOrderSupplier,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders]);
      options?.onSuccess?.(...args);
    },
  });
}
