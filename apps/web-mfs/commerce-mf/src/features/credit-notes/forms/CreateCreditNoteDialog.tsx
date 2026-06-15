import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCreditNote } from '@/hooks/credit-notes';
import { type CreateCreditNoteFormData, createCreditNoteSchema } from '@/schemas/credit-notes';

interface CreateCreditNoteDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateCreditNoteDialog: React.FC<CreateCreditNoteDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateCreditNoteFormData>({
    resolver: zodResolver(createCreditNoteSchema),
    defaultValues: {
      type: undefined,
      partyType: undefined,
      partyName: '',
      creditNoteNumber: '',
      amount: 0,
      reason: '',
    },
  });

  const createMutation = useCreateCreditNote({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        type: data.type,
        partyType: data.partyType,
        partyName: data.partyName,
        creditNoteNumber: data.creditNoteNumber,
        amount: data.amount,
        reason: data.reason,
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
      <TextField name="creditNoteNumber" label="Credit Note Number" placeholder="CN-001" />
      <TextField name="amount" label="Amount" type="number" placeholder="0.00" />
      <TextArea name="reason" label="Reason" placeholder="Reason for the credit note" />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Credit Note
        </Button>
      </DialogActions>
    </Form>
  );
};
