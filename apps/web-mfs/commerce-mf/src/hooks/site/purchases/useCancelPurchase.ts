import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CancelPurchasePayload } from '@/schemas/purchases';
import { cancelPurchase } from '@/services/site/purchases.service';
import { invalidatePurchase } from './keys';

// Cancels a purchase and refreshes the purchase's header, items, quotations, sourcing items and suppliers
export function useCancelPurchase(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, CancelPurchasePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, CancelPurchasePayload>({
    ...options,
    mutationFn: cancelPurchase,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
