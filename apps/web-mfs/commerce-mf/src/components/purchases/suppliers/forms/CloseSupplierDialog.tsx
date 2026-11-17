import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type PurchaseCloseReasonFormData,
  type PurchaseDetail,
  type PurchaseLeg,
  purchaseCloseReasonSchema,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

interface CloseSupplierDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  leg: PurchaseLeg;
  onSuccess: () => void;
  onCancel: () => void;
}

// Closes the supplier as it stands, with an optional reason saved with the supplier
export const CloseSupplierDialog: React.FC<CloseSupplierDialogProps> = ({
  binding,
  purchase,
  leg,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<PurchaseCloseReasonFormData>({
    resolver: zodResolver(purchaseCloseReasonSchema),
    defaultValues: { reason: '' },
  });
  const closeMutation = binding.useCloseSupplier({ onSuccess });

  return (
    <Form
      form={form}
      mutation={closeMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, legId: leg.id, reason: data.reason.trim() || undefined })}
    >
      <TextArea
        name="reason"
        label="Reason (optional)"
        placeholder="e.g. Supplier cannot supply the rest this month"
        description="Saved with the supplier"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Closing...">
          Close Supplier
        </Button>
      </DialogActions>
    </Form>
  );
};
