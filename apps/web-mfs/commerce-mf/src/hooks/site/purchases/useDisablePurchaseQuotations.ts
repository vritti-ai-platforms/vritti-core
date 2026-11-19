import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { DisablePurchaseQuotationsPayload } from '@/schemas/purchases';
import { disablePurchaseQuotations } from '@/services/site/purchases.service';
import { invalidatePurchase } from './keys';

// Stops requiring quotations on an open purchase, recording why, then refreshes the purchase and its actions
export function useDisablePurchaseQuotations(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DisablePurchaseQuotationsPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, DisablePurchaseQuotationsPayload>({
    ...options,
    mutationFn: disablePurchaseQuotations,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
