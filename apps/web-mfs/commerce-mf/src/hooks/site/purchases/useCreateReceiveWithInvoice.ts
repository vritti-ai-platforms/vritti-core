import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedReceiveWithInvoice, ReceiveWithInvoicePayload } from '@/schemas/receive-with-invoices';
import { createReceiveWithInvoice } from '@/services/site/purchases.service';

// Drafts a Receive with Invoice and refreshes the purchases and their documents
export function useCreateReceiveWithInvoice(
  options?: Omit<
    UseMutationOptions<CreateResponse<CreatedReceiveWithInvoice>, AxiosError, ReceiveWithInvoicePayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CreatedReceiveWithInvoice>, AxiosError, ReceiveWithInvoicePayload>({
    ...options,
    mutationFn: createReceiveWithInvoice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.supplierInvoices,
        Tables.supplierInvoiceLines,
        Tables.supplierInvoiceHolds,
        Tables.inboundDeliveries,
        Tables.inboundDeliveryLines,
        Tables.goodsReceipts,
        Tables.goodsReceiptItems,
        Tables.goodsReceiptLots,
        Tables.goodsReceiptLines,
        Tables.purchaseSuppliers,
        Tables.purchases,
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
