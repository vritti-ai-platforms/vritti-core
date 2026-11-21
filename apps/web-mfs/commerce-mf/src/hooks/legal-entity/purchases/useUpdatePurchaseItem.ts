import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdatePurchaseItemPayload } from '@/schemas/purchases';
import { updatePurchaseItem } from '@/services/legal-entity/purchases.service';

// Updates an item of a purchase's items and refreshes the purchase's header, items
export function useUpdatePurchaseItem(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseItemPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseItemPayload>({
    ...options,
    mutationFn: updatePurchaseItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseItems]);
      options?.onSuccess?.(...args);
    },
  });
}
