import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddPurchaseAllocationsFromQuotationPayload } from '@/schemas/purchases';
import { addPurchaseAllocationsFromQuotation } from '@/services/legal-entity/purchases.service';
import { invalidatePurchase, PURCHASE_SOURCING_ITEMS_KEY, PURCHASE_SUPPLIERS_KEY } from './keys';

// Allocates items from posted quotation lines and refreshes the purchase's header, sourcing items and suppliers
export function useAddPurchaseAllocationsFromQuotation(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, AddPurchaseAllocationsFromQuotationPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, AddPurchaseAllocationsFromQuotationPayload>({
    ...options,
    mutationFn: addPurchaseAllocationsFromQuotation,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id, [PURCHASE_SOURCING_ITEMS_KEY, PURCHASE_SUPPLIERS_KEY]);
      options?.onSuccess?.(...args);
    },
  });
}
