import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ClosePurchaseLegPayload } from '@/schemas/purchases';
import { closePurchaseLeg } from '@/services/site/purchases.service';

// Closes a supplier leg and refreshes the purchase's header, suppliers and sourcing items and the documents
export function useClosePurchaseLeg(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ClosePurchaseLegPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ClosePurchaseLegPayload>({
    ...options,
    mutationFn: closePurchaseLeg,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.purchaseSuppliers,
        Tables.purchaseOrders,
        Tables.purchaseOrderItems,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
