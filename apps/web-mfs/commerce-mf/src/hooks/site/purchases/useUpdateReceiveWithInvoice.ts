import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateReceiveWithInvoiceVars } from '@/schemas/receive-with-invoices';
import { updateReceiveWithInvoice } from '@/services/site/purchases.service';

// Replaces a draft Receive with Invoice and refreshes the purchases and their documents
export function useUpdateReceiveWithInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateReceiveWithInvoiceVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateReceiveWithInvoiceVars>({
    ...options,
    mutationFn: updateReceiveWithInvoice,
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
        Tables.supplierItems,
        Tables.supplierSiteItems,
        Tables.supplierItemPrices,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
