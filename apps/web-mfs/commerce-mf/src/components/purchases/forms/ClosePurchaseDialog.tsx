import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type PurchaseCloseReasonFormData, type PurchaseDetail, purchaseCloseReasonSchema } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';

interface ClosePurchaseDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Closes the purchase as it stands, with an optional reason saved with it
export const ClosePurchaseDialog: React.FC<ClosePurchaseDialogProps> = ({ binding, purchase, onSuccess, onCancel }) => {
  const form = useForm<PurchaseCloseReasonFormData>({
    resolver: zodResolver(purchaseCloseReasonSchema),
    defaultValues: { reason: '' },
  });
  const closeMutation = binding.useClose({ onSuccess });

  return (
    <Form
      form={form}
      mutation={closeMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, reason: data.reason.trim() || undefined })}
    >
      <TextArea
        name="reason"
        label="Reason (optional)"
        placeholder="e.g. The rest is no longer needed this month"
        description="Saved with the purchase"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Keep Open
        </Button>
        <Button type="submit" loadingText="Closing...">
          Close Purchase
        </Button>
      </DialogActions>
    </Form>
  );
};
