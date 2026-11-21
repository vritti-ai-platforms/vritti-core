import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CancelPurchaseLegPayload } from '@/schemas/purchases';
import { cancelPurchaseLeg } from '@/services/legal-entity/purchases.service';

// Cancels a supplier of a purchase and refreshes everything shown of the purchase
export function useCancelPurchaseLeg(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, CancelPurchaseLegPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, CancelPurchaseLegPayload>({
    ...options,
    mutationFn: cancelPurchaseLeg,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.purchaseSuppliers,
        Tables.purchaseOrders,
        Tables.inboundDeliveries,
        Tables.purchaseItemAllocations,
        Tables.purchaseItems,
        Tables.supplierQuotationItems,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
