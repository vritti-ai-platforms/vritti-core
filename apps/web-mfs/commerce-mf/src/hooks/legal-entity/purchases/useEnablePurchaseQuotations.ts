import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { EnablePurchaseQuotationsPayload } from '@/schemas/purchases';
import { enablePurchaseQuotations } from '@/services/legal-entity/purchases.service';
import { invalidatePurchase } from './keys';

// Requires quotations on a purchase none of whose suppliers is submitted yet, then refreshes the purchase and its actions
export function useEnablePurchaseQuotations(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, EnablePurchaseQuotationsPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, EnablePurchaseQuotationsPayload>({
    ...options,
    mutationFn: enablePurchaseQuotations,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
