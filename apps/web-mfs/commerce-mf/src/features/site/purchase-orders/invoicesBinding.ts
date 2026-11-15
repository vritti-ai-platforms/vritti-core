import { SITE_PURCHASE_ORDERS } from '@vritti/commerce-permissions/purchase-orders';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { buildSlug } from '@vritti/quantum-ui/slug';
import type { PurchaseOrderSupplierInvoicesBinding } from '@/components/supplier-invoices/bindings';
import { newInvoiceSearch } from '@/components/supplier-invoices/newInvoiceSearch';
import { SITE_PURCHASE_ORDER_INVOICES_TABLE_KEY, usePurchaseOrderInvoicesTable } from '@/hooks/site/supplier-invoices';

const supplierPath = (supplier: { supplierId: string; supplierName: string }) =>
  `../../suppliers/${buildSlug(supplier.supplierName, supplier.supplierId)}`;

// A purchase order's invoices at its site; invoices live on the supplier's page two levels up from the order, where a
// new one is started on its Invoices tab
export const invoicesBinding: PurchaseOrderSupplierInvoicesBinding = {
  permissions: {
    view: SITE_PURCHASE_ORDERS.invoices.view,
    add: SITE_SUPPLIERS.invoices.add,
  },
  spansSites: false,
  invoicePath: (invoice) => `${supplierPath(invoice)}/invoices/${buildSlug(invoice.invoiceNumber, invoice.id)}`,
  newInvoicePath: (purchaseOrder) => `${supplierPath(purchaseOrder)}${newInvoiceSearch({}, { tab: 'invoices' })}`,
  tableKey: SITE_PURCHASE_ORDER_INVOICES_TABLE_KEY,
  tableSlug: (purchaseOrderId) => `commerce-site-purchase-order-${purchaseOrderId}-invoices`,
  useTable: usePurchaseOrderInvoicesTable,
};
