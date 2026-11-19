import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type ChangePurchaseMinQuotationsFormData,
  changePurchaseMinQuotationsSchema,
  type PurchaseDetail,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';

interface ChangePurchaseMinQuotationsDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes how many posted quotations each item needs; lowering it asks why, which the server records
export const ChangePurchaseMinQuotationsDialog: React.FC<ChangePurchaseMinQuotationsDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ChangePurchaseMinQuotationsFormData>({
    resolver: zodResolver(changePurchaseMinQuotationsSchema),
    defaultValues: { minQuotations: purchase.minQuotations, reason: '' },
  });
  const changeMutation = binding.useChangeMinQuotations({ onSuccess });
  const minQuotations = useWatch({ control: form.control, name: 'minQuotations' });
  const isLowering = Number(minQuotations) < purchase.minQuotations;

  return (
    <Form
      form={form}
      mutation={changeMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        minQuotations: data.minQuotations,
        reason: data.reason.trim() || null,
      })}
    >
      <TextField
        name="minQuotations"
        label="Quotations needed"
        type="number"
        integer
        positive
        nonZero
        description={`Currently ${purchase.minQuotations}; applies to suppliers submitted from now on`}
      />
      {isLowering && (
        <TextArea
          name="reason"
          label="Reason"
          placeholder="e.g. Only two suppliers stock these items"
          description="Lowering the minimum is recorded with who made the change"
        />
      )}
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Change Minimum
        </Button>
      </DialogActions>
    </Form>
  );
};
