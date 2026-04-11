import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useApplyCreditNote } from '@/hooks/useApplyCreditNote';
import { type ApplyCreditNoteFormData, applyCreditNoteSchema } from '@/schemas/credit-notes';

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
  const form = useForm<ApplyCreditNoteFormData>({
    resolver: zodResolver(applyCreditNoteSchema),
    defaultValues: {
      invoiceId: '',
      amount: '',
    },
  });

  const applyMutation = useApplyCreditNote(creditNoteId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={applyMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: creditNoteId,
        data: {
          invoiceId: data.invoiceId,
          amount: Number(data.amount),
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
