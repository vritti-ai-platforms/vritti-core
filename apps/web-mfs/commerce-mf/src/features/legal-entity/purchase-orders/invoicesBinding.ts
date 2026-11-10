import { LE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type { PurchaseOrderSupplierInvoicesBinding } from '@/components/supplier-invoices/bindings';
import {
  LE_PURCHASE_ORDER_INVOICES_TABLE_KEY,
  useCreatePurchaseOrderInvoice,
  usePurchaseOrderInvoicesTable,
} from '@/hooks/legal-entity/supplier-invoices';

// A purchase order's invoices at the legal entity; each opens in the supplier invoices feature, two levels up from the order
export const invoicesBinding: PurchaseOrderSupplierInvoicesBinding = {
  permissions: {
    view: LE_PURCHASE_ORDERS.invoices.view,
    add: LE_PURCHASE_ORDERS.invoices.add,
  },
  spansSites: true,
  invoicePath: (invoice) => `../../supplier-invoices/${buildSlug(invoice.invoiceNumber, invoice.id)}`,
  tableKey: LE_PURCHASE_ORDER_INVOICES_TABLE_KEY,
  tableSlug: (purchaseOrderId) => `commerce-le-purchase-order-${purchaseOrderId}-invoices`,
  useTable: usePurchaseOrderInvoicesTable,
  useCreateInvoice: useCreatePurchaseOrderInvoice,
};
