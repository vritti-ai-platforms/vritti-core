import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdatePurchaseAllocationPayload } from '@/schemas/purchases';
import { updatePurchaseAllocation } from '@/services/legal-entity/purchases.service';
import { invalidatePurchase, PURCHASE_SOURCING_ITEMS_KEY, PURCHASE_SUPPLIERS_KEY } from './keys';

// Updates a purchase's allocation and refreshes the purchase's header, sourcing items and suppliers
export function useUpdatePurchaseAllocation(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseAllocationPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseAllocationPayload>({
    ...options,
    mutationFn: updatePurchaseAllocation,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id, [PURCHASE_SOURCING_ITEMS_KEY, PURCHASE_SUPPLIERS_KEY]);
      options?.onSuccess?.(...args);
    },
  });
}
