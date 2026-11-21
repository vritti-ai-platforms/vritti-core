import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { setSupplierPurchasingBlocked } from '@/services/legal-entity/suppliers.service';

export interface SetSupplierPurchasingBlockedPayload {
  id: string;
  purchasingBlocked: boolean;
}

// Blocks or unblocks new purchase orders and goods receipts from a supplier, refreshing the table and the supplier
export function useSetSupplierPurchasingBlocked(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SetSupplierPurchasingBlockedPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, SetSupplierPurchasingBlockedPayload>({
    ...options,
    mutationFn: setSupplierPurchasingBlocked,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.suppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
