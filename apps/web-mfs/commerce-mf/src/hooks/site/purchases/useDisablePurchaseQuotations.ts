import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { DisablePurchaseQuotationsPayload } from '@/schemas/purchases';
import { disablePurchaseQuotations } from '@/services/site/purchases.service';

// Stops requiring quotations on an open purchase, recording why, then refreshes the purchase and its actions
export function useDisablePurchaseQuotations(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DisablePurchaseQuotationsPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, DisablePurchaseQuotationsPayload>({
    ...options,
    mutationFn: disablePurchaseQuotations,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchases, Tables.purchaseQuotationChanges]);
      options?.onSuccess?.(...args);
    },
  });
}
