import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CreateInvoiceFormData, createInvoiceSchema } from '@/schemas/invoices';
import { useCreateInvoice } from '@/hooks/site/invoices';

interface CreateInvoiceDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      type: undefined,
      invoiceNumber: '',
      partyType: undefined,
      partyName: '',
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      paymentTerms: '',
      notes: '',
    },
  });

  const createMutation = useCreateInvoice({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        type: data.type,
        invoiceNumber: data.invoiceNumber,
        partyType: data.partyType,
        partyName: data.partyName,
        issuedDate: data.issuedDate,
        dueDate: data.dueDate || undefined,
        paymentTerms: data.paymentTerms || undefined,
        notes: data.notes || undefined,
      })}
    >
      <Select
        name="type"
        label="Type"
        placeholder="Select type"
        options={[
          { value: 'PAYABLE', label: 'Payable' },
          { value: 'RECEIVABLE', label: 'Receivable' },
        ]}
      />
      <TextField name="invoiceNumber" label="Invoice Number" placeholder="INV-001" />
      <Select
        name="partyType"
        label="Party Type"
        placeholder="Select party type"
        options={[
          { value: 'SUPPLIER', label: 'Supplier' },
          { value: 'CUSTOMER', label: 'Customer' },
          { value: 'AGGREGATOR', label: 'Aggregator' },
        ]}
      />
      <TextField name="partyName" label="Party Name" placeholder="Enter party name" />
      <DatePicker name="issuedDate" label="Issued Date" />
      <DatePicker name="dueDate" label="Due Date" />
      <TextField name="paymentTerms" label="Payment Terms" placeholder="e.g. Net 30" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Invoice
        </Button>
      </DialogActions>
    </Form>
  );
};
