import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { PurchaseItemRef } from '@/schemas/purchases';
import { removePurchaseItem } from '@/services/site/purchases.service';
import { invalidatePurchase, PURCHASE_ITEMS_KEY } from './keys';

// Removes an item from a purchase's items and refreshes the purchase's header, items
export function useRemovePurchaseItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, PurchaseItemRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, PurchaseItemRef>({
    ...options,
    mutationFn: removePurchaseItem,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id, [PURCHASE_ITEMS_KEY]);
      options?.onSuccess?.(...args);
    },
  });
}
