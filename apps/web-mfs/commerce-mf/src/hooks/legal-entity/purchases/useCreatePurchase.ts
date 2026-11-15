import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreatePurchasePayload, PurchaseData } from '@/schemas/purchases';
import { createPurchase } from '@/services/legal-entity/purchases.service';
import { PURCHASES_KEY } from './keys';

// Creates a purchase and refreshes the purchases
export function useCreatePurchase(
  options?: Omit<UseMutationOptions<CreateResponse<PurchaseData>, AxiosError, CreatePurchasePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<PurchaseData>, AxiosError, CreatePurchasePayload>({
    ...options,
    mutationFn: createPurchase,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
