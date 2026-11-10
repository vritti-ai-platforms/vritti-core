import type React from 'react';
import type { PurchaseOrderSupplierInvoicesBinding } from '../bindings';
import { SupplierInvoicesTable } from '../SupplierInvoicesTable';

interface PurchaseOrderInvoicesTabProps {
  binding: PurchaseOrderSupplierInvoicesBinding;
  purchaseOrderId: string;
}

// A purchase order's Invoices tab: its invoices; an invoice opens on its own page outside the order
export const PurchaseOrderInvoicesTab: React.FC<PurchaseOrderInvoicesTabProps> = ({ binding, purchaseOrderId }) => {
  const invoicesTableQuery = binding.useTable(purchaseOrderId);

  return (
    <SupplierInvoicesTable
      binding={binding}
      mode="tab"
      query={invoicesTableQuery}
      slug={binding.tableSlug(purchaseOrderId)}
      queryKey={binding.tableKey(purchaseOrderId)}
      purchaseOrderId={purchaseOrderId}
      emptyDescription="Record the supplier's invoice for this order, then enter its billed lines and post it."
    />
  );
};
