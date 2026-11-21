import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { discardReceiveWithInvoice } from '@/services/legal-entity/purchases.service';

// Discards a draft Receive with Invoice and refreshes the purchases and their documents
export function useDiscardReceiveWithInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: discardReceiveWithInvoice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.supplierInvoices,
        Tables.supplierInvoiceLines,
        Tables.supplierInvoiceHolds,
        Tables.goodsReceipts,
        Tables.goodsReceiptItems,
        Tables.goodsReceiptLots,
        Tables.goodsReceiptLines,
        Tables.goodsReceiptLineItems,
        Tables.inboundDeliveries,
        Tables.inboundDeliveryLines,
        Tables.purchaseOrders,
        Tables.purchaseOrderItems,
        Tables.purchaseItemAllocations,
        Tables.purchaseSuppliers,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
