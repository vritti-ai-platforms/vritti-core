import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deletePurchase } from '@/services/legal-entity/purchases.service';

// Deletes a purchase and refreshes the purchases list
export function useDeletePurchase(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deletePurchase,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.purchases,
        Tables.purchaseItems,
        Tables.purchaseSuppliers,
        Tables.purchaseQuotationChanges,
        Tables.purchaseItemAllocations,
        Tables.supplierQuotations,
        Tables.supplierQuotationItems,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
