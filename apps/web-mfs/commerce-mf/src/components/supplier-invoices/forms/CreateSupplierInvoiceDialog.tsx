import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type CreateSupplierInvoiceFormData,
  createSupplierInvoiceSchema,
  INVOICEABLE_PURCHASE_ORDER_STATUSES,
  type SupplierInvoice,
} from '@/schemas/supplier-invoices';
import { PurchaseOrderSelector } from '@/selectors/purchase-order';
import type { SupplierInvoicesListBinding } from '../bindings';

interface CreateSupplierInvoiceDialogProps {
  binding: Pick<SupplierInvoicesListBinding, 'useCreateInvoice'>;
  supplierId?: string;
  purchaseOrderId?: string;
  onSuccess: (invoice: SupplierInvoice) => void;
  onCancel: () => void;
}

const INVOICEABLE_STATUS_PARAM = INVOICEABLE_PURCHASE_ORDER_STATUSES.join(',');

// Records a draft invoice for a purchase order — the one the list belongs to, or one picked from the confirmed orders
export const CreateSupplierInvoiceDialog: React.FC<CreateSupplierInvoiceDialogProps> = ({
  binding,
  supplierId,
  purchaseOrderId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateSupplierInvoiceFormData>({
    resolver: zodResolver(createSupplierInvoiceSchema),
    defaultValues: { purchaseOrderId, invoiceNumber: '', notes: '' },
  });
  const createMutation = binding.useCreateInvoice({ onSuccess });
  const invoiceDate = useWatch({ control: form.control, name: 'invoiceDate' });

  // The tax date follows the invoice date until it is picked
  useEffect(() => {
    if (invoiceDate && !form.getFieldState('taxDate').isDirty) form.setValue('taxDate', invoiceDate);
  }, [invoiceDate, form]);

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ ...data, notes: data.notes || null })}
    >
      {!purchaseOrderId && (
        <PurchaseOrderSelector
          name="purchaseOrderId"
          description="Confirmed or received orders; the invoice takes its supplier, site, currency and exchange rate"
          params={supplierId ? { status: INVOICEABLE_STATUS_PARAM, supplierId } : { status: INVOICEABLE_STATUS_PARAM }}
        />
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField name="invoiceNumber" label="Invoice Number" placeholder="As printed by the supplier" />
        <DatePicker name="invoiceDate" label="Invoice Date" />
        <DatePicker name="taxDate" label="Tax Date" description="Follows the invoice date until changed" />
      </div>
      <TextArea name="notes" label="Notes (optional)" placeholder="e.g. Received with the second delivery" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Invoice
        </Button>
      </DialogActions>
    </Form>
  );
};
