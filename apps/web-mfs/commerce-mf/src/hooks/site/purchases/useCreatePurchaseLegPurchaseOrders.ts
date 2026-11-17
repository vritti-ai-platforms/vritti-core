import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreatedPurchaseLegPurchaseOrders, CreatePurchaseLegPurchaseOrdersPayload } from '@/schemas/purchases';
import { createPurchaseLegPurchaseOrders } from '@/services/site/purchases.service';
import { invalidatePurchase, PURCHASE_DOCUMENT_KEYS } from './keys';

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
      invalidatePurchase(queryClient, variables.id);
      for (const queryKey of PURCHASE_DOCUMENT_KEYS) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
