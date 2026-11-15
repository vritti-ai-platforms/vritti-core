import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdatePurchasePayload } from '@/schemas/purchases';
import { updatePurchase } from '@/services/site/purchases.service';
import { invalidatePurchase } from './keys';

// Updates a purchase's details and refreshes the purchase's header
export function useUpdatePurchase(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchasePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchasePayload>({
    ...options,
    mutationFn: updatePurchase,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
