import type { ReceiveWithInvoiceOpenLinesParams } from '@/schemas/receive-with-invoices';

export const PURCHASES_KEY = ['commerce', 'le', 'purchases'] as const;
export const PURCHASES_TABLE_KEY = [...PURCHASES_KEY, 'table'] as const;
export const PURCHASE_SETTINGS_KEY = [...PURCHASES_KEY, 'settings'] as const;
export const PURCHASE_KEY = (id: string) => [...PURCHASES_KEY, id] as const;
export const PURCHASE_COUNTS_KEY = (id: string) => [...PURCHASE_KEY(id), 'counts'] as const;
export const PURCHASE_PROGRESS_KEY = (id: string) => [...PURCHASE_KEY(id), 'progress'] as const;
export const PURCHASE_ACTIONS_KEY = (id: string) => [...PURCHASE_KEY(id), 'actions'] as const;
export const PURCHASE_ITEMS_KEY = (id: string) => [...PURCHASE_KEY(id), 'items'] as const;
export const PURCHASE_ITEMS_TABLE_KEY = (id: string) => [...PURCHASE_ITEMS_KEY(id), 'table'] as const;
export const PURCHASE_ITEM_FACETS_KEY = (id: string) => [...PURCHASE_ITEMS_KEY(id), 'facets'] as const;
export const PURCHASE_ITEM_COMPARISON_KEY = (id: string) => [...PURCHASE_ITEMS_KEY(id), 'comparison'] as const;
export const PURCHASE_ITEM_KEY = (id: string, itemId: string) => [...PURCHASE_ITEMS_KEY(id), itemId] as const;
export const PURCHASE_ITEM_COUNTS_KEY = (id: string, itemId: string) =>
  [...PURCHASE_ITEM_KEY(id, itemId), 'counts'] as const;
export const PURCHASE_ITEM_PROGRESS_KEY = (id: string, itemId: string) =>
  [...PURCHASE_ITEM_KEY(id, itemId), 'progress'] as const;
export const PURCHASE_ITEM_ALLOCATIONS_TABLE_KEY = (id: string, itemId: string) =>
  [...PURCHASE_ITEM_KEY(id, itemId), 'allocations', 'table'] as const;
export const PURCHASE_ITEM_QUOTES_TABLE_KEY = (id: string, itemId: string) =>
  [...PURCHASE_ITEM_KEY(id, itemId), 'quotes', 'table'] as const;
export const PURCHASE_ITEM_DOCUMENTS_TABLE_KEY = (id: string, itemId: string) =>
  [...PURCHASE_ITEM_KEY(id, itemId), 'documents', 'table'] as const;
export const PURCHASE_ITEM_SITE_STOCK_KEY = (id: string, itemId: string) =>
  [...PURCHASE_ITEM_KEY(id, itemId), 'site-stock'] as const;
export const PURCHASE_QUOTATIONS_KEY = (id: string) => [...PURCHASE_KEY(id), 'quotations'] as const;
export const PURCHASE_QUOTATIONS_TABLE_KEY = (id: string) => [...PURCHASE_QUOTATIONS_KEY(id), 'table'] as const;
export const PURCHASE_SUPPLIERS_KEY = (id: string) => [...PURCHASE_KEY(id), 'suppliers'] as const;
export const PURCHASE_SUPPLIERS_TABLE_KEY = (id: string) => [...PURCHASE_SUPPLIERS_KEY(id), 'table'] as const;
export const PURCHASE_SUPPLIER_COUNTS_KEY = (id: string) => [...PURCHASE_SUPPLIERS_KEY(id), 'counts'] as const;
export const PURCHASE_SUPPLIER_KEY = (id: string, legId: string) => [...PURCHASE_SUPPLIERS_KEY(id), legId] as const;
export const PURCHASE_DOCUMENTS_KEY = (id: string) => [...PURCHASE_KEY(id), 'documents'] as const;
export const RECEIVE_WITH_INVOICES_KEY = [...PURCHASES_KEY, 'receive-with-invoices'] as const;
export const RECEIVE_WITH_INVOICE_KEY = (invoiceId: string) => [...RECEIVE_WITH_INVOICES_KEY, invoiceId] as const;
export const RECEIVE_WITH_INVOICE_OPEN_LINES_KEY = (params: ReceiveWithInvoiceOpenLinesParams) =>
  [...RECEIVE_WITH_INVOICES_KEY, 'open-lines', params] as const;
