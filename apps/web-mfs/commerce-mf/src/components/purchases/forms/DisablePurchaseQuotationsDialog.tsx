import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type PurchaseDetail, type PurchaseReasonFormData, purchaseReasonSchema } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';

interface DisablePurchaseQuotationsDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Stops requiring quotations on the purchase, recording why
export const DisablePurchaseQuotationsDialog: React.FC<DisablePurchaseQuotationsDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<PurchaseReasonFormData>({
    resolver: zodResolver(purchaseReasonSchema),
    defaultValues: { reason: '' },
  });
  const disableMutation = binding.useDisableQuotations({ onSuccess });

  return (
    <Form
      form={form}
      mutation={disableMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, reason: data.reason })}
    >
      <TextArea
        name="reason"
        label="Reason"
        placeholder="e.g. Only one supplier stocks these items"
        description="Recorded with who made the change"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Keep Quotations
        </Button>
        <Button type="submit" variant="destructive" loadingText="Disabling...">
          Disable Quotations
        </Button>
      </DialogActions>
    </Form>
  );
};
