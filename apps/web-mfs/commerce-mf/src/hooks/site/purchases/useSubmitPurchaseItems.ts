import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { submitPurchaseItems } from '@/services/site/purchases.service';
import { invalidatePurchase, PURCHASE_ITEMS_KEY } from './keys';

// Submits a purchase's items and refreshes the purchase's header, items
export function useSubmitPurchaseItems(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: submitPurchaseItems,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables, [PURCHASE_ITEMS_KEY]);
      options?.onSuccess?.(...args);
    },
  });
}
