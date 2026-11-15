import { LE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import { LE_SUPPLIER_INVOICES } from '@vritti/commerce-permissions/supplier-invoices';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type { PurchaseOrderSupplierInvoicesBinding } from '@/components/supplier-invoices/bindings';
import { newInvoiceSearch } from '@/components/supplier-invoices/newInvoiceSearch';
import {
  LE_PURCHASE_ORDER_INVOICES_TABLE_KEY,
  usePurchaseOrderInvoicesTable,
} from '@/hooks/legal-entity/supplier-invoices';

// A purchase order's invoices at the legal entity; each opens in the supplier invoices feature, two levels up from the
// order, where a new one is started with the order's supplier and site
export const invoicesBinding: PurchaseOrderSupplierInvoicesBinding = {
  permissions: {
    view: LE_PURCHASE_ORDERS.invoices.view,
    add: LE_SUPPLIER_INVOICES.add,
  },
  spansSites: true,
  invoicePath: (invoice) => `../../supplier-invoices/${buildSlug(invoice.invoiceNumber, invoice.id)}`,
  newInvoicePath: (purchaseOrder) =>
    `../../supplier-invoices${newInvoiceSearch({ supplierId: purchaseOrder.supplierId, siteId: purchaseOrder.siteId })}`,
  tableKey: LE_PURCHASE_ORDER_INVOICES_TABLE_KEY,
  tableSlug: (purchaseOrderId) => `commerce-le-purchase-order-${purchaseOrderId}-invoices`,
  useTable: usePurchaseOrderInvoicesTable,
};
