import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useApplyCreditNote } from '@/hooks/credit-notes';
import type { ApplyCreditNoteFormData } from '@/schemas/credit-notes';
import { applyCreditNoteSchema } from '@/schemas/credit-notes';

interface ApplyCreditNoteDialogProps {
  creditNoteId: string;
  remaining: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ApplyCreditNoteDialog: React.FC<ApplyCreditNoteDialogProps> = ({
  creditNoteId,
  remaining,
  onSuccess,
  onCancel,
}) => {
  const applySchema = useMemo(
    () =>
      applyCreditNoteSchema.extend({
        amount: zodNumericField({ required: 'Amount is required', positive: true, max: remaining }),
      }),
    [remaining],
  );

  const form = useForm<ApplyCreditNoteFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      invoiceId: '',
      amount: 0,
    },
  });

  const applyMutation = useApplyCreditNote(creditNoteId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={applyMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: creditNoteId,
        data: {
          invoiceId: data.invoiceId,
          amount: data.amount,
        },
      })}
    >
      <TextField name="invoiceId" label="Invoice ID" placeholder="Enter invoice ID" />
      <TextField name="amount" label="Amount" type="number" placeholder={`Max: ${remaining.toFixed(2)}`} />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Applying...">
          Apply Credit
        </Button>
      </div>
    </Form>
  );
};
