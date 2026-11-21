import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { PurchaseLegRef } from '@/schemas/purchases';
import { submitPurchaseLeg } from '@/services/site/purchases.service';

// Resubmits one supplier leg of a purchase and refreshes the purchase's header, suppliers and sourcing items
export function useSubmitPurchaseLeg(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, PurchaseLegRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, PurchaseLegRef>({
    ...options,
    mutationFn: submitPurchaseLeg,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseSuppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
