import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ConfirmPurchaseLegPurchaseOrderPayload } from '@/schemas/purchases';
import { confirmPurchaseLegPurchaseOrder } from '@/services/legal-entity/purchases.service';
import {
  invalidatePurchase,
  PURCHASE_DOCUMENT_KEYS,
  PURCHASE_SOURCING_ITEMS_KEY,
  PURCHASE_SUPPLIERS_KEY,
} from './keys';

// Confirms a supplier leg's sent purchase order and refreshes the purchase's header, suppliers and sourcing items and the documents
export function useConfirmPurchaseLegPurchaseOrder(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ConfirmPurchaseLegPurchaseOrderPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ConfirmPurchaseLegPurchaseOrderPayload>({
    ...options,
    mutationFn: confirmPurchaseLegPurchaseOrder,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id, [PURCHASE_SUPPLIERS_KEY, PURCHASE_SOURCING_ITEMS_KEY]);
      for (const queryKey of PURCHASE_DOCUMENT_KEYS) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
