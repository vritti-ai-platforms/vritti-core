import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type {
  InvoiceableGoodsReceipt,
  InvoiceableGoodsReceiptsParams,
  SupplierInvoiceRef,
} from '@/schemas/supplier-invoices';
import { getInvoiceableGoodsReceipts } from '@/services/legal-entity/supplier-invoices.service';
import { LE_INVOICEABLE_GOODS_RECEIPTS_KEY } from './keys';

// Fetches the received batches an invoice's supplier still has to invoice at the invoice's site, for its line picker
export function useInvoiceableGoodsReceipts(invoice: SupplierInvoiceRef, params: InvoiceableGoodsReceiptsParams) {
  return useQuery<InvoiceableGoodsReceipt[], AxiosError>({
    queryKey: LE_INVOICEABLE_GOODS_RECEIPTS_KEY(invoice.supplierId, invoice.siteId, params),
    queryFn: () => getInvoiceableGoodsReceipts(invoice.supplierId, invoice.siteId, params),
  });
}
