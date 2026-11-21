import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ClosePurchasePayload } from '@/schemas/purchases';
import { closePurchase } from '@/services/legal-entity/purchases.service';

// Closes a purchase and refreshes everything shown of it
export function useClosePurchase(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ClosePurchasePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ClosePurchasePayload>({
    ...options,
    mutationFn: closePurchase,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.purchases,
        Tables.purchaseSuppliers,
        Tables.purchaseOrders,
        Tables.purchaseOrderItems,
        Tables.inboundDeliveries,
        Tables.purchaseItemAllocations,
        Tables.purchaseItems,
        Tables.supplierQuotationItems,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
