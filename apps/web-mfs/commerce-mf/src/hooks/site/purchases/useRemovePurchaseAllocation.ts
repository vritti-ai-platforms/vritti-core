import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { PurchaseAllocationRef } from '@/schemas/purchases';
import { removePurchaseAllocation } from '@/services/site/purchases.service';
import { invalidatePurchase, PURCHASE_SOURCING_ITEMS_KEY, PURCHASE_SUPPLIERS_KEY } from './keys';

// Removes a purchase's allocation and refreshes the purchase's header, sourcing items and suppliers
export function useRemovePurchaseAllocation(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, PurchaseAllocationRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, PurchaseAllocationRef>({
    ...options,
    mutationFn: removePurchaseAllocation,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id, [PURCHASE_SOURCING_ITEMS_KEY, PURCHASE_SUPPLIERS_KEY]);
      options?.onSuccess?.(...args);
    },
  });
}
