import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { PurchaseItemRef } from '@/schemas/purchases';
import { removePurchaseItem } from '@/services/site/purchases.service';

// Removes an item from a purchase's items and refreshes the purchase's header, items
export function useRemovePurchaseItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, PurchaseItemRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, PurchaseItemRef>({
    ...options,
    mutationFn: removePurchaseItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.purchaseItems,
        Tables.purchaseItemAllocations,
        Tables.supplierQuotationItems,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
