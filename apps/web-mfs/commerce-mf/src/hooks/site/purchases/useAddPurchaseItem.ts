import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddPurchaseItemPayload, CreatedPurchaseRecord } from '@/schemas/purchases';
import { addPurchaseItem } from '@/services/site/purchases.service';

// Adds an item to a purchase's items and refreshes the purchase's header, items
export function useAddPurchaseItem(
  options?: Omit<
    UseMutationOptions<CreateResponse<CreatedPurchaseRecord>, AxiosError, AddPurchaseItemPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CreatedPurchaseRecord>, AxiosError, AddPurchaseItemPayload>({
    ...options,
    mutationFn: addPurchaseItem,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseItems]);
      options?.onSuccess?.(...args);
    },
  });
}
