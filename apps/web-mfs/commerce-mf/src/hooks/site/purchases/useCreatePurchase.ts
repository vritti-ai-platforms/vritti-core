import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedPurchase, CreatePurchasePayload } from '@/schemas/purchases';
import { createPurchase } from '@/services/site/purchases.service';

// Creates a purchase and refreshes the purchases
export function useCreatePurchase(
  options?: Omit<UseMutationOptions<CreateResponse<CreatedPurchase>, AxiosError, CreatePurchasePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CreatedPurchase>, AxiosError, CreatePurchasePayload>({
    ...options,
    mutationFn: createPurchase,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchases]);
      options?.onSuccess?.(...args);
    },
  });
}
