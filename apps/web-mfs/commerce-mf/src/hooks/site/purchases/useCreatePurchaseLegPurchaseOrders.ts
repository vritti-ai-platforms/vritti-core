import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedPurchaseLegPurchaseOrders, CreatePurchaseLegPurchaseOrdersPayload } from '@/schemas/purchases';
import { createPurchaseLegPurchaseOrders } from '@/services/site/purchases.service';

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
      invalidateWrites(queryClient, [
        Tables.purchaseOrders,
        Tables.purchaseOrderItems,
        Tables.purchaseItemAllocations,
        Tables.purchaseSuppliers,
        Tables.purchases,
        Tables.supplierItems,
        Tables.supplierSiteItems,
        Tables.supplierItemPrices,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
