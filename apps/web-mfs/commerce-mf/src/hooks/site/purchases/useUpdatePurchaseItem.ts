import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdatePurchaseItemPayload } from '@/schemas/purchases';
import { updatePurchaseItem } from '@/services/site/purchases.service';
import { invalidatePurchase } from './keys';

// Updates an item of a purchase's items and refreshes the purchase's header, items
export function useUpdatePurchaseItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseItemPayload>({
    ...options,
    mutationFn: updatePurchaseItem,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
