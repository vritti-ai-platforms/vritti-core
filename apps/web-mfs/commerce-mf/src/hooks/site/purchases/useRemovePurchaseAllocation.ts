import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { PurchaseAllocationRef } from '@/schemas/purchases';
import { removePurchaseAllocation } from '@/services/site/purchases.service';

// Removes a purchase's allocation and refreshes the purchase's header, sourcing items and suppliers
export function useRemovePurchaseAllocation(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, PurchaseAllocationRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, PurchaseAllocationRef>({
    ...options,
    mutationFn: removePurchaseAllocation,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseItemAllocations, Tables.purchaseSuppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
