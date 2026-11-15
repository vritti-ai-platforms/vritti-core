import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { completePurchaseQuotations } from '@/services/legal-entity/purchases.service';
import { invalidatePurchase, PURCHASE_QUOTATIONS_KEY, PURCHASE_SOURCING_ITEMS_KEY } from './keys';

// Completes a purchase's quotations and refreshes the purchase's header, quotations and sourcing items
export function useCompletePurchaseQuotations(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: completePurchaseQuotations,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables, [PURCHASE_QUOTATIONS_KEY, PURCHASE_SOURCING_ITEMS_KEY]);
      options?.onSuccess?.(...args);
    },
  });
}
