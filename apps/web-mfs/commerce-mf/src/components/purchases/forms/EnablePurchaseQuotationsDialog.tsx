import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type PurchaseDetail,
  type PurchaseMinQuotationsFormData,
  purchaseMinQuotationsSchema,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';

interface EnablePurchaseQuotationsDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Requires quotations on the purchase, at a minimum number per item
export const EnablePurchaseQuotationsDialog: React.FC<EnablePurchaseQuotationsDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<PurchaseMinQuotationsFormData>({
    resolver: zodResolver(purchaseMinQuotationsSchema),
    defaultValues: { minQuotations: purchase.minQuotations },
  });
  const enableMutation = binding.useEnableQuotations({ onSuccess });

  return (
    <Form
      form={form}
      mutation={enableMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, minQuotations: data.minQuotations })}
    >
      <TextField
        name="minQuotations"
        label="Quotations needed"
        type="number"
        integer
        positive
        nonZero
        description="Posted quotations each item needs before its supplier is submitted"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Enabling...">
          Enable Quotations
        </Button>
      </DialogActions>
    </Form>
  );
};
