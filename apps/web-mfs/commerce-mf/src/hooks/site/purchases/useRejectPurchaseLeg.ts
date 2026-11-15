import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { RejectPurchaseLegPayload } from '@/schemas/purchases';
import { rejectPurchaseLeg } from '@/services/site/purchases.service';
import { invalidatePurchase, PURCHASE_SOURCING_ITEMS_KEY, PURCHASE_SUPPLIERS_KEY } from './keys';

// Rejects a supplier leg of a purchase back to sourcing and refreshes the purchase's header, suppliers and sourcing items
export function useRejectPurchaseLeg(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, RejectPurchaseLegPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, RejectPurchaseLegPayload>({
    ...options,
    mutationFn: rejectPurchaseLeg,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id, [PURCHASE_SUPPLIERS_KEY, PURCHASE_SOURCING_ITEMS_KEY]);
      options?.onSuccess?.(...args);
    },
  });
}
