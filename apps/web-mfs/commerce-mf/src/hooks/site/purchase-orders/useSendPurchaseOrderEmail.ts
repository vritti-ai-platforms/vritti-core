import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SendPurchaseOrderEmailPayload } from '@/schemas/purchase-orders';
import { sendPurchaseOrderEmail } from '@/services/site/purchase-orders.service';

// Emails a purchase order to its supplier
export function useSendPurchaseOrderEmail(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SendPurchaseOrderEmailPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SendPurchaseOrderEmailPayload>({
    ...options,
    mutationFn: sendPurchaseOrderEmail,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.purchaseOrders,
        Tables.supplierItems,
        Tables.supplierSiteItems,
        Tables.supplierItemPrices,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
