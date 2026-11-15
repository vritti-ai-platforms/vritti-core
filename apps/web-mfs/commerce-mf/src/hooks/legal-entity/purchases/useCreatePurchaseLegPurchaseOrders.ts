import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreatedPurchaseLegPurchaseOrders, CreatePurchaseLegPurchaseOrdersPayload } from '@/schemas/purchases';
import { createPurchaseLegPurchaseOrders } from '@/services/legal-entity/purchases.service';
import {
  invalidatePurchase,
  PURCHASE_DOCUMENT_KEYS,
  PURCHASE_SOURCING_ITEMS_KEY,
  PURCHASE_SUPPLIERS_KEY,
} from './keys';

// Raises a supplier leg's purchase orders and refreshes the purchase's header, suppliers and sourcing items and the documents
export function useCreatePurchaseLegPurchaseOrders(
  options?: Omit<
    UseMutationOptions<
      CreateResponse<CreatedPurchaseLegPurchaseOrders>,
      AxiosError,
      CreatePurchaseLegPurchaseOrdersPayload
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateResponse<CreatedPurchaseLegPurchaseOrders>,
    AxiosError,
    CreatePurchaseLegPurchaseOrdersPayload
  >({
    ...options,
    mutationFn: createPurchaseLegPurchaseOrders,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id, [PURCHASE_SUPPLIERS_KEY, PURCHASE_SOURCING_ITEMS_KEY]);
      for (const queryKey of PURCHASE_DOCUMENT_KEYS) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
