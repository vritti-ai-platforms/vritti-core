import type { QueryClient } from '@tanstack/react-query';
import { GOODS_RECEIPTS_KEY } from '@/hooks/legal-entity/goods-receipts/keys';
import { INBOUND_DELIVERIES_KEY } from '@/hooks/legal-entity/inbound-deliveries/keys';
import { PURCHASE_ORDERS_KEY } from '@/hooks/legal-entity/purchase-orders/keys';
import { LE_SUPPLIER_INVOICES_KEY } from '@/hooks/legal-entity/supplier-invoices/keys';
import type { ReceiveWithInvoiceOpenLinesParams } from '@/schemas/receive-with-invoices';

export const PURCHASES_KEY = ['commerce', 'le', 'purchases'] as const;
export const PURCHASES_TABLE_KEY = [...PURCHASES_KEY, 'table'] as const;
export const PURCHASE_KEY = (id: string) => [...PURCHASES_KEY, id] as const;
export const PURCHASE_ITEMS_KEY = (id: string) => [...PURCHASE_KEY(id), 'items'] as const;
export const PURCHASE_QUOTATIONS_KEY = (id: string) => [...PURCHASE_KEY(id), 'quotations'] as const;
export const PURCHASE_SOURCING_ITEMS_KEY = (id: string) => [...PURCHASE_KEY(id), 'sourcing-items'] as const;
export const PURCHASE_SUPPLIERS_KEY = (id: string) => [...PURCHASE_KEY(id), 'suppliers'] as const;
export const RECEIVE_WITH_INVOICES_KEY = [...PURCHASES_KEY, 'receive-with-invoices'] as const;
export const RECEIVE_WITH_INVOICE_KEY = (invoiceId: string) => [...RECEIVE_WITH_INVOICES_KEY, invoiceId] as const;
export const RECEIVE_WITH_INVOICE_OPEN_LINES_KEY = (params: ReceiveWithInvoiceOpenLinesParams) =>
  [...RECEIVE_WITH_INVOICES_KEY, 'open-lines', params] as const;
export const PURCHASE_DOCUMENT_KEYS = [
  PURCHASE_ORDERS_KEY,
  INBOUND_DELIVERIES_KEY,
  GOODS_RECEIPTS_KEY,
  LE_SUPPLIER_INVOICES_KEY,
] as const;

// Refreshes the purchases list and a purchase's header, plus the views of it a change touched
export function invalidatePurchase(
  queryClient: QueryClient,
  id: string,
  views: ((id: string) => readonly unknown[])[] = [],
): void {
  queryClient.invalidateQueries({ queryKey: PURCHASE_KEY(id), exact: true });
  for (const queryKey of [PURCHASES_TABLE_KEY, ...views.map((view) => view(id))]) {
    queryClient.invalidateQueries({ queryKey });
  }
}
