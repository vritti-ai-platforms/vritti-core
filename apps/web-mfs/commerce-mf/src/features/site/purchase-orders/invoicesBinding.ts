import { SITE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type { PurchaseOrderSupplierInvoicesBinding } from '@/components/supplier-invoices/bindings';
import {
  SITE_PURCHASE_ORDER_INVOICES_TABLE_KEY,
  useCreatePurchaseOrderInvoice,
  usePurchaseOrderInvoicesTable,
} from '@/hooks/site/supplier-invoices';

// A purchase order's invoices at its site; each opens on its supplier's invoice page, two levels up from the order
export const invoicesBinding: PurchaseOrderSupplierInvoicesBinding = {
  permissions: {
    view: SITE_PURCHASE_ORDERS.invoices.view,
    add: SITE_PURCHASE_ORDERS.invoices.add,
  },
  spansSites: false,
  invoicePath: (invoice) =>
    `../../suppliers/${buildSlug(invoice.supplierName, invoice.supplierId)}/invoices/${buildSlug(invoice.invoiceNumber, invoice.id)}`,
  tableKey: SITE_PURCHASE_ORDER_INVOICES_TABLE_KEY,
  tableSlug: (purchaseOrderId) => `commerce-site-purchase-order-${purchaseOrderId}-invoices`,
  useTable: usePurchaseOrderInvoicesTable,
  useCreateInvoice: useCreatePurchaseOrderInvoice,
};
