import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { FileText, ReceiptText } from 'lucide-react';
import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from './bindings';
import { CreatePurchaseSupplierInvoiceDialog } from './forms/CreatePurchaseSupplierInvoiceDialog';
import { receiveWithInvoiceSearch } from './receive-with-invoices/receiveWithInvoiceSearch';

interface PurchasesListActionsProps {
  binding: PurchasesBinding;
  // The site picked in the list's context, where the session has no site
  siteId?: string;
  needsSite: boolean;
}

// Creates a supplier invoice for what a supplier's purchases at the site have received, or opens a Receive with Invoice
// for an invoice that comes with the goods
export const PurchasesListActions: React.FC<PurchasesListActionsProps> = ({ binding, siteId, needsSite }) => {
  const { permissions } = binding;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const supplierInvoiceDialog = useDialog();

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        permission={permissions.invoice}
        startAdornment={<FileText className="size-4" />}
        onClick={supplierInvoiceDialog.open}
        disabled={needsSite}
        disabledTip="Pick the site to invoice at first."
      >
        Create Supplier Invoice
      </Button>
      <Button
        size="sm"
        variant="outline"
        permission={permissions.receive}
        startAdornment={<ReceiptText className="size-4" />}
        onClick={() => navigate(`receive-with-invoices/new${receiveWithInvoiceSearch({ siteId })}`)}
        disabled={needsSite}
        disabledTip="Pick the site the goods arrive at first."
      >
        Receive with Invoice
      </Button>
      <Dialog
        handle={supplierInvoiceDialog}
        icon={FileText}
        title="Create Supplier Invoice"
        description="Drafts the supplier's invoice from what its purchases have received; it is checked and posted in its invoices."
        className="max-w-2xl"
        content={(close) => (
          <CreatePurchaseSupplierInvoiceDialog
            binding={binding}
            siteId={siteId}
            onSuccess={(invoice) => {
              close();
              navigate(`${workspaceBase(pathname)}/${binding.invoicePath(invoice)}`);
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
