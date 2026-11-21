import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { submitPurchase } from '@/services/site/purchases.service';

// Submits a purchase's sourcing and refreshes the purchase's header, sourcing items and suppliers
export function useSubmitPurchase(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: submitPurchase,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchases, Tables.purchaseSuppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
