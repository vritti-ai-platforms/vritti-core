import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddPurchaseAllocationsFromQuotationPayload } from '@/schemas/purchases';
import { addPurchaseAllocationsFromQuotation } from '@/services/legal-entity/purchases.service';

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
      invalidateWrites(queryClient, [Tables.purchaseItemAllocations, Tables.purchaseSuppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
