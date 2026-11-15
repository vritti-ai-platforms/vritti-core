import { Button } from '@vritti/quantum-ui/Button';
import { Plus } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import type { PurchaseOrderSupplierInvoicesBinding } from '../bindings';
import { SupplierInvoicesTable } from '../SupplierInvoicesTable';

interface PurchaseOrderInvoicesTabProps {
  binding: PurchaseOrderSupplierInvoicesBinding;
  purchaseOrder: PurchaseOrderDetail;
}

// A purchase order's Invoices tab: the invoices with a line on it; a new one is started in the supplier invoices
// feature with the order's supplier and site, and each opens on its own page there
export const PurchaseOrderInvoicesTab: React.FC<PurchaseOrderInvoicesTabProps> = ({ binding, purchaseOrder }) => {
  const navigate = useNavigate();
  const invoicesTableQuery = binding.useTable(purchaseOrder.id);
  const nothingToInvoice = purchaseOrder.invoiceStatus === 'NOTHING_TO_INVOICE';
  const fullyInvoiced = purchaseOrder.invoiceStatus === 'INVOICED';

  const addAction = (
    <Button
      size="sm"
      permission={binding.permissions.add}
      startAdornment={<Plus className="size-4" />}
      onClick={() => navigate(binding.newInvoicePath(purchaseOrder), { relative: 'path' })}
      disabled={nothingToInvoice || fullyInvoiced}
      disabledTip={
        fullyInvoiced
          ? 'Everything received on this order is invoiced'
          : 'Nothing has been received on this order yet; invoices cover received goods'
      }
    >
      Add Invoice
    </Button>
  );

  return (
    <SupplierInvoicesTable
      binding={binding}
      mode="tab"
      query={invoicesTableQuery}
      slug={binding.tableSlug(purchaseOrder.id)}
      queryKey={binding.tableKey(purchaseOrder.id)}
      purchaseOrderId={purchaseOrder.id}
      addAction={addAction}
      emptyDescription="Record the supplier's invoice, then invoice the receipts of this order on it and post it."
    />
  );
};
