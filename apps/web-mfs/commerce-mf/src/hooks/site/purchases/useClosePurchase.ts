import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ClosePurchasePayload } from '@/schemas/purchases';
import { closePurchase } from '@/services/site/purchases.service';
import { invalidatePurchase } from './keys';

// Closes a purchase and refreshes everything shown of it
export function useClosePurchase(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ClosePurchasePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ClosePurchasePayload>({
    ...options,
    mutationFn: closePurchase,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
