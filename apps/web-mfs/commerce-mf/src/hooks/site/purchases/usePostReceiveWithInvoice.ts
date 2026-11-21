import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { postReceiveWithInvoice } from '@/services/site/purchases.service';

// Posts a draft Receive with Invoice and refreshes the purchases and their documents
export function usePostReceiveWithInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: postReceiveWithInvoice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.inventoryItemLots,
        Tables.goodsReceiptLots,
        Tables.inventoryItemQuants,
        Tables.inventoryItemSerials,
        Tables.goodsReceiptLines,
        Tables.inventoryItemLedger,
        Tables.inventoryItemCosts,
        Tables.inventoryItemQuantCosts,
        Tables.goodsReceipts,
        Tables.purchaseOrderItems,
        Tables.purchaseOrders,
        Tables.inboundDeliveries,
        Tables.supplierInvoices,
        Tables.supplierInvoiceLines,
        Tables.supplierInvoiceHolds,
        Tables.purchaseSuppliers,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
