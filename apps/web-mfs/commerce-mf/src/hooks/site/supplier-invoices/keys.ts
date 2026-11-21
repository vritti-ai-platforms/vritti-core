import type { InvoiceableGoodsReceiptsParams } from '@/schemas/supplier-invoices';

export const SITE_SUPPLIER_INVOICES_KEY = ['commerce', 'site', 'supplier-invoices'] as const;

export const SITE_SUPPLIER_INVOICES_TABLE_KEY = (supplierId: string) =>
  [...SITE_SUPPLIER_INVOICES_KEY, 'suppliers', supplierId, 'table'] as const;
export const SITE_SUPPLIER_INVOICE_KEY = (supplierId: string, invoiceId: string) =>
  [...SITE_SUPPLIER_INVOICES_KEY, 'suppliers', supplierId, invoiceId] as const;
export const SITE_SUPPLIER_INVOICE_COUNTS_KEY = (supplierId: string, invoiceId: string) =>
  [...SITE_SUPPLIER_INVOICE_KEY(supplierId, invoiceId), 'counts'] as const;
export const SITE_INVOICEABLE_GOODS_RECEIPTS_KEY = (supplierId: string, params: InvoiceableGoodsReceiptsParams) =>
  [...SITE_SUPPLIER_INVOICES_KEY, 'suppliers', supplierId, 'invoiceable-goods-receipts', params] as const;

export const SITE_PURCHASE_ORDER_INVOICES_TABLE_KEY = (purchaseOrderId: string) =>
  [...SITE_SUPPLIER_INVOICES_KEY, 'purchase-orders', purchaseOrderId, 'table'] as const;
