import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ConfirmPurchaseLegPurchaseOrderPayload } from '@/schemas/purchases';
import { confirmPurchaseLegPurchaseOrder } from '@/services/legal-entity/purchases.service';

// Confirms a supplier leg's sent purchase order and refreshes the purchase's header, suppliers and sourcing items and the documents
export function useConfirmPurchaseLegPurchaseOrder(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ConfirmPurchaseLegPurchaseOrderPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ConfirmPurchaseLegPurchaseOrderPayload>({
    ...options,
    mutationFn: confirmPurchaseLegPurchaseOrder,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders, Tables.purchaseSuppliers, Tables.purchases]);
      options?.onSuccess?.(...args);
    },
  });
}
