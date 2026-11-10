export const SITE_SUPPLIER_INVOICES_KEY = ['commerce', 'site', 'supplier-invoices'] as const;

export const SITE_SUPPLIER_INVOICES_TABLE_KEY = (supplierId: string) =>
  [...SITE_SUPPLIER_INVOICES_KEY, 'suppliers', supplierId, 'table'] as const;
export const SITE_SUPPLIER_INVOICE_KEY = (supplierId: string, invoiceId: string) =>
  [...SITE_SUPPLIER_INVOICES_KEY, 'suppliers', supplierId, invoiceId] as const;

export const SITE_PURCHASE_ORDER_INVOICES_TABLE_KEY = (purchaseOrderId: string) =>
  [...SITE_SUPPLIER_INVOICES_KEY, 'purchase-orders', purchaseOrderId, 'table'] as const;
