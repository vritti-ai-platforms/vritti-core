import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePayment } from '@/hooks/payments';
import type { CreatePaymentFormData } from '@/schemas/invoices';
import { createPaymentSchema } from '@/schemas/invoices';

interface RecordPaymentDialogProps {
  invoiceId: string;
  balance: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const RecordPaymentDialog: React.FC<RecordPaymentDialogProps> = ({
  invoiceId,
  balance,
  onSuccess,
  onCancel,
}) => {
  const paymentSchema = useMemo(
    () =>
      createPaymentSchema.extend({
        amount: zodNumericField({ required: 'Amount is required', positive: true, max: balance }),
      }),
    [balance],
  );

  const form = useForm<CreatePaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId,
      amount: 0,
      method: undefined,
      reference: '',
      notes: '',
    },
  });

  const createMutation = useCreatePayment(invoiceId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      })}
    >
      <TextField name="amount" label="Amount" type="number" placeholder={`Max: ${balance.toFixed(2)}`} />
      <Select
        name="method"
        label="Payment Method"
        placeholder="Select method"
        options={[
          { value: 'CASH', label: 'Cash' },
          { value: 'CARD', label: 'Card' },
          { value: 'UPI', label: 'UPI' },
          { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
          { value: 'WALLET', label: 'Wallet' },
          { value: 'ONLINE', label: 'Online' },
        ]}
      />
      <TextField name="reference" label="Reference" placeholder="Transaction reference" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Recording...">
          Record Payment
        </Button>
      </DialogActions>
    </Form>
  );
};
