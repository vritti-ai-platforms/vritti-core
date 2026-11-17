import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type PurchaseDetail, type UpdatePurchaseFormData, updatePurchaseSchema } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';

interface UpdatePurchaseDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Edits whether a purchase collects quotations and its notes while it is in the Items step; a cleared note is removed
export const UpdatePurchaseDialog: React.FC<UpdatePurchaseDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdatePurchaseFormData>({
    resolver: zodResolver(updatePurchaseSchema),
    defaultValues: {
      notes: purchase.notes ?? '',
      quotationsRequired: purchase.quotationsRequired,
      minQuotations: purchase.minQuotations,
    },
  });
  const updateMutation = binding.useUpdate({ onSuccess });
  const quotationsRequired = useWatch({ control: form.control, name: 'quotationsRequired' });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        notes: data.notes.trim() || null,
        quotationsRequired: data.quotationsRequired,
        minQuotations: data.minQuotations,
      })}
    >
      <Switch
        name="quotationsRequired"
        label="Request quotations"
        description="Ask suppliers for their prices before choosing who to buy from; orders then use the prices they quote"
      />
      {quotationsRequired && (
        <TextField
          name="minQuotations"
          label="Quotations needed"
          type="number"
          integer
          positive
          nonZero
          description="How many suppliers must send a quotation before you choose suppliers"
        />
      )}
      <TextArea name="notes" label="Notes" placeholder="Anything others working on this purchase should know" />
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
