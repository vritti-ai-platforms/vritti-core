import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import type { DialogHandle } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { Plus, ReceiptText } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { SupplierInvoiceCreateBinding } from './bindings';
import { CreateSupplierInvoiceDialog } from './forms/CreateSupplierInvoiceDialog';
import { NEW_INVOICE_PARAM, NEW_INVOICE_SITE_PARAM, NEW_INVOICE_SUPPLIER_PARAM } from './newInvoiceSearch';

interface AddSupplierInvoiceButtonProps {
  binding: Pick<SupplierInvoiceCreateBinding, 'permissions'>;
  handle: DialogHandle;
}

// Opens the Add Invoice dialog of its list
export const AddSupplierInvoiceButton: React.FC<AddSupplierInvoiceButtonProps> = ({ binding, handle }) => (
  <Button
    size="sm"
    permission={binding.permissions.add}
    startAdornment={<Plus className="size-4" />}
    onClick={handle.open}
  >
    Add Invoice
  </Button>
);

interface AddSupplierInvoiceDialogProps {
  binding: SupplierInvoiceCreateBinding;
  handle: DialogHandle;
  supplierId?: string;
}

interface Prefill {
  supplierId?: string;
  siteId?: string;
}

// Starts a draft invoice and opens it, so its lines can be entered next; a link carrying the new-invoice params (from a
// purchase order) opens it straight away with its supplier and site
export const AddSupplierInvoiceDialog: React.FC<AddSupplierInvoiceDialogProps> = ({ binding, handle, supplierId }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { available } = usePermission(binding.permissions.add);
  const [prefill, setPrefill] = useState<Prefill>({});
  const requested = searchParams.has(NEW_INVOICE_PARAM);
  const { open, isOpen } = handle;

  // A prefill serves only the opening it came with; Add Invoice clicked later starts blank
  useEffect(() => {
    if (!isOpen) setPrefill({});
  }, [isOpen]);

  useEffect(() => {
    if (!requested || !available) return;
    setPrefill({
      supplierId: searchParams.get(NEW_INVOICE_SUPPLIER_PARAM) ?? undefined,
      siteId: searchParams.get(NEW_INVOICE_SITE_PARAM) ?? undefined,
    });
    open();
    setSearchParams(
      (params) => {
        params.delete(NEW_INVOICE_PARAM);
        params.delete(NEW_INVOICE_SUPPLIER_PARAM);
        params.delete(NEW_INVOICE_SITE_PARAM);
        return params;
      },
      { replace: true },
    );
  }, [requested, available, searchParams, setSearchParams, open]);

  return (
    <Dialog
      handle={handle}
      icon={ReceiptText}
      title="Add Invoice"
      className="max-w-2xl"
      description="Starts a draft for the supplier's invoice. Enter the receipts and charges it covers next, then post it."
      content={(close) => (
        <CreateSupplierInvoiceDialog
          binding={binding}
          supplierId={supplierId}
          prefill={prefill}
          onSuccess={(created) => {
            close();
            navigate(binding.invoicePath(created), { relative: 'path' });
          }}
          onCancel={close}
        />
      )}
    />
  );
};
