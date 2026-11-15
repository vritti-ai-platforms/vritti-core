import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type PurchaseHeader, type PurchaseReasonFormData, purchaseReasonSchema } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';

interface CancelPurchaseDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  onSuccess: () => void;
  onCancel: () => void;
}

// Cancels the purchase, saving why with it
export const CancelPurchaseDialog: React.FC<CancelPurchaseDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<PurchaseReasonFormData>({
    resolver: zodResolver(purchaseReasonSchema),
    defaultValues: { reason: '' },
  });
  const cancelMutation = binding.useCancel({ onSuccess });

  return (
    <Form
      form={form}
      mutation={cancelMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, reason: data.reason })}
    >
      <TextArea
        name="reason"
        label="Reason"
        placeholder="e.g. Stock transferred from another site instead"
        description="Saved with the purchase"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Keep Purchase
        </Button>
        <Button type="submit" variant="destructive" loadingText="Cancelling...">
          Cancel Purchase
        </Button>
      </DialogActions>
    </Form>
  );
};
