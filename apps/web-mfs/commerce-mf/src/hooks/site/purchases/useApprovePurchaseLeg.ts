import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { PurchaseLegRef } from '@/schemas/purchases';
import { approvePurchaseLeg } from '@/services/site/purchases.service';
import { invalidatePurchase, PURCHASE_SOURCING_ITEMS_KEY, PURCHASE_SUPPLIERS_KEY } from './keys';

// Approves a supplier leg of a purchase and refreshes the purchase's header, suppliers and sourcing items
export function useApprovePurchaseLeg(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, PurchaseLegRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, PurchaseLegRef>({
    ...options,
    mutationFn: approvePurchaseLeg,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id, [PURCHASE_SUPPLIERS_KEY, PURCHASE_SOURCING_ITEMS_KEY]);
      options?.onSuccess?.(...args);
    },
  });
}
