import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddPurchaseAllocationPayload, PurchaseAllocation } from '@/schemas/purchases';
import { addPurchaseAllocation } from '@/services/site/purchases.service';

// Allocates part of an item to a supplier and refreshes the purchase's header, sourcing items and suppliers
export function useAddPurchaseAllocation(
  options?: Omit<
    UseMutationOptions<CreateResponse<PurchaseAllocation>, AxiosError, AddPurchaseAllocationPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<PurchaseAllocation>, AxiosError, AddPurchaseAllocationPayload>({
    ...options,
    mutationFn: addPurchaseAllocation,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseItemAllocations, Tables.purchaseSuppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
