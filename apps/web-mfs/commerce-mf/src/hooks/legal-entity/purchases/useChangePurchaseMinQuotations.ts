import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ChangePurchaseMinQuotationsPayload } from '@/schemas/purchases';
import { changePurchaseMinQuotations } from '@/services/legal-entity/purchases.service';
import { invalidatePurchase } from './keys';

// Changes how many posted quotations each item needs before its supplier is submitted, then refreshes the purchase and its actions
export function useChangePurchaseMinQuotations(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ChangePurchaseMinQuotationsPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ChangePurchaseMinQuotationsPayload>({
    ...options,
    mutationFn: changePurchaseMinQuotations,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
