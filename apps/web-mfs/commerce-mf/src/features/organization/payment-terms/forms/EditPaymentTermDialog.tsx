import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdatePaymentTerm } from '@/hooks/organization/payment-terms';
import {
  type EditPaymentTermFormData,
  editPaymentTermFormSchema,
  PAYMENT_TERM_BASELINE_OPTIONS,
  type PaymentTermData,
} from '@/schemas/payment-terms';

interface EditPaymentTermDialogProps {
  paymentTerm: PaymentTermData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditPaymentTermDialog: React.FC<EditPaymentTermDialogProps> = ({ paymentTerm, onSuccess, onCancel }) => {
  const isDraft = paymentTerm.status === 'DRAFT';
  const form = useForm<EditPaymentTermFormData>({
    resolver: zodResolver(editPaymentTermFormSchema),
    defaultValues: {
      code: paymentTerm.code,
      name: paymentTerm.name,
      baseline: paymentTerm.baseline,
      description: paymentTerm.description ?? '',
    },
  });

  const updateMutation = useUpdatePaymentTerm({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: paymentTerm.id,
        data: {
          name: data.name,
          description: data.description || null,
          ...(isDraft ? { baseline: data.baseline } : {}),
        },
      })}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="code" label="Code" disabled description="Code cannot be changed" />
          <TextField name="name" label="Name" placeholder="e.g. Net 30" />
        </div>
        <Select
          name="baseline"
          label="Due days count from"
          placeholder="Select baseline"
          options={PAYMENT_TERM_BASELINE_OPTIONS}
          disabled={!isDraft}
          description={isDraft ? undefined : 'Only a draft can change when due days start counting'}
        />
        <TextArea name="description" label="Description" placeholder="Optional notes for buyers and accounts" />
      </div>
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
