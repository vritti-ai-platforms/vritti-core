import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useFormatters, useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  buildEditSupplierInvoiceSchema,
  type EditSupplierInvoiceFormData,
  type SupplierInvoice,
} from '@/schemas/supplier-invoices';
import type { SupplierInvoicesBinding } from '../bindings';

interface EditSupplierInvoiceDialogProps {
  binding: SupplierInvoicesBinding;
  invoice: SupplierInvoice;
  onSuccess: () => void;
  onCancel: () => void;
}

// Edits an invoice's number, dates, notes and foreign-currency rate; its tax date only while it is a draft
export const EditSupplierInvoiceDialog: React.FC<EditSupplierInvoiceDialogProps> = ({
  binding,
  invoice,
  onSuccess,
  onCancel,
}) => {
  const fmt = useFormatters();
  const workspaceCurrency = useWorkspaceCurrency();
  const foreignCurrency = invoice.currencyCode !== workspaceCurrency;
  const isDraft = invoice.status === 'DRAFT';
  const isTaxDateFollowing = isDraft && invoice.taxDate === invoice.invoiceDate;
  const form = useForm<EditSupplierInvoiceFormData>({
    resolver: zodResolver(buildEditSupplierInvoiceSchema({ foreignCurrency })),
    defaultValues: {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      taxDate: invoice.taxDate,
      exchangeRate: invoice.exchangeRate,
      notes: invoice.notes ?? '',
    },
  });
  const updateMutation = binding.useUpdateInvoice({ onSuccess });
  const invoiceDate = useWatch({ control: form.control, name: 'invoiceDate' });

  // A draft's tax date that matches its invoice date keeps following it until it is picked
  useEffect(() => {
    if (isTaxDateFollowing && invoiceDate && !form.getFieldState('taxDate').isDirty) {
      form.setValue('taxDate', invoiceDate);
    }
  }, [isTaxDateFollowing, invoiceDate, form]);

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={({ exchangeRate, taxDate, ...data }) => ({
        invoice,
        data: {
          ...data,
          notes: data.notes || null,
          ...(isDraft ? { taxDate } : {}),
          ...(foreignCurrency ? { exchangeRate } : {}),
        },
      })}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField name="invoiceNumber" label="Invoice Number" placeholder="As printed by the supplier" />
        <DatePicker name="invoiceDate" label="Invoice Date" />
        <DatePicker
          name="taxDate"
          label="Tax Date"
          disabled={!isDraft}
          description={isDraft ? 'Changes only while the invoice is a draft' : 'Locked once the invoice is posted'}
        />
      </div>
      {foreignCurrency && (
        <TextField
          name="exchangeRate"
          label={`Exchange Rate (${invoice.currencyCode} → ${workspaceCurrency})`}
          type="number"
          positive
          nonZero
          description={`The order's rate is ${fmt.number(invoice.poExchangeRate).primary}; a different rate is flagged`}
        />
      )}
      <TextArea name="notes" label="Notes (optional)" placeholder="e.g. Received with the second delivery" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
