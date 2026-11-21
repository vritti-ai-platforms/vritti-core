import type { InvoiceableGoodsReceiptsParams } from '@/schemas/supplier-invoices';

export const LE_SUPPLIER_INVOICES_KEY = ['commerce', 'le', 'supplier-invoices'] as const;
export const LE_SUPPLIER_INVOICES_TABLE_KEY = [...LE_SUPPLIER_INVOICES_KEY, 'table'] as const;
export const LE_SUPPLIER_INVOICE_KEY = (invoiceId: string) => [...LE_SUPPLIER_INVOICES_KEY, invoiceId] as const;
export const LE_SUPPLIER_INVOICE_COUNTS_KEY = (invoiceId: string) =>
  [...LE_SUPPLIER_INVOICE_KEY(invoiceId), 'counts'] as const;
export const LE_INVOICEABLE_GOODS_RECEIPTS_KEY = (
  supplierId: string,
  siteId: string,
  params: InvoiceableGoodsReceiptsParams,
) => [...LE_SUPPLIER_INVOICES_KEY, 'invoiceable-goods-receipts', supplierId, siteId, params] as const;

export const LE_PURCHASE_ORDER_INVOICES_TABLE_KEY = (purchaseOrderId: string) =>
  [...LE_SUPPLIER_INVOICES_KEY, 'purchase-orders', purchaseOrderId, 'table'] as const;
