import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ClosePurchaseLegPayload } from '@/schemas/purchases';
import { closePurchaseLeg } from '@/services/legal-entity/purchases.service';
import { invalidatePurchase, PURCHASE_DOCUMENT_KEYS } from './keys';

// Closes a supplier leg and refreshes the purchase's header, suppliers and sourcing items and the documents
export function useClosePurchaseLeg(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ClosePurchaseLegPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ClosePurchaseLegPayload>({
    ...options,
    mutationFn: closePurchaseLeg,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      for (const queryKey of PURCHASE_DOCUMENT_KEYS) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
