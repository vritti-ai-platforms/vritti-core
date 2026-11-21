import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedPurchaseLegGoodsReceipt, CreatePurchaseLegGoodsReceiptPayload } from '@/schemas/purchases';
import { createPurchaseLegGoodsReceipt } from '@/services/legal-entity/purchases.service';

// Starts a draft goods receipt of a supplier leg and refreshes the purchase's header, suppliers and sourcing items and the documents
export function useCreatePurchaseLegGoodsReceipt(
  options?: Omit<
    UseMutationOptions<
      CreateResponse<CreatedPurchaseLegGoodsReceipt>,
      AxiosError,
      CreatePurchaseLegGoodsReceiptPayload
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CreatedPurchaseLegGoodsReceipt>, AxiosError, CreatePurchaseLegGoodsReceiptPayload>({
    ...options,
    mutationFn: createPurchaseLegGoodsReceipt,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.goodsReceipts,
        Tables.goodsReceiptItems,
        Tables.purchaseSuppliers,
        Tables.purchases,
        Tables.inboundDeliveries,
        Tables.inboundDeliveryLines,
        Tables.purchaseOrders,
        Tables.purchaseOrderItems,
        Tables.purchaseItemAllocations,
        Tables.supplierItems,
        Tables.supplierSiteItems,
        Tables.supplierItemPrices,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
