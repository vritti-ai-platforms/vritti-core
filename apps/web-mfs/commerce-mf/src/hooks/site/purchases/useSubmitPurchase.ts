import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { submitPurchase } from '@/services/site/purchases.service';
import { invalidatePurchase } from './keys';

// Submits a purchase's sourcing and refreshes the purchase's header, sourcing items and suppliers
export function useSubmitPurchase(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: submitPurchase,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables);
      options?.onSuccess?.(...args);
    },
  });
}
