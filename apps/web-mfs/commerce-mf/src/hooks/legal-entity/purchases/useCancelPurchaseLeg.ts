import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CancelPurchaseLegPayload } from '@/schemas/purchases';
import { cancelPurchaseLeg } from '@/services/legal-entity/purchases.service';
import { invalidatePurchase } from './keys';

// Cancels a supplier of a purchase and refreshes everything shown of the purchase
export function useCancelPurchaseLeg(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, CancelPurchaseLegPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, CancelPurchaseLegPayload>({
    ...options,
    mutationFn: cancelPurchaseLeg,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
