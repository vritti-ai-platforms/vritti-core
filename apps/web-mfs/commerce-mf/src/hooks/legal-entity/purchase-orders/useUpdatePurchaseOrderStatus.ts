import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdatePurchaseOrderStatusPayload } from '@/schemas/purchase-orders';
import { updatePurchaseOrderStatus } from '@/services/legal-entity/purchase-orders.service';

// Moves a purchase order along its manual workflow
export function useUpdatePurchaseOrderStatus(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseOrderStatusPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseOrderStatusPayload>({
    ...options,
    mutationFn: updatePurchaseOrderStatus,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.purchaseOrders,
        Tables.supplierItems,
        Tables.supplierSiteItems,
        Tables.supplierItemPrices,
        Tables.purchaseSuppliers,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
