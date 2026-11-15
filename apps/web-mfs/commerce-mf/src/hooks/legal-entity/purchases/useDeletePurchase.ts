import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deletePurchase } from '@/services/legal-entity/purchases.service';
import { PURCHASES_TABLE_KEY } from './keys';

// Deletes a purchase and refreshes the purchases list
export function useDeletePurchase(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deletePurchase,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
