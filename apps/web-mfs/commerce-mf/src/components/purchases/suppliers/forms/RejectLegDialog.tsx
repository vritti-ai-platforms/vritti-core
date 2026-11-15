import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type PurchaseHeader,
  type PurchaseLeg,
  type PurchaseReasonFormData,
  purchaseReasonSchema,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

interface RejectLegDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  leg: PurchaseLeg;
  onSuccess: () => void;
  onCancel: () => void;
}

// Rejects one supplier back to sourcing with the reason shown on its card; the other suppliers carry on
export const RejectLegDialog: React.FC<RejectLegDialogProps> = ({ binding, purchase, leg, onSuccess, onCancel }) => {
  const form = useForm<PurchaseReasonFormData>({
    resolver: zodResolver(purchaseReasonSchema),
    defaultValues: { reason: '' },
  });
  const rejectMutation = binding.useRejectLeg({ onSuccess });

  return (
    <Form
      form={form}
      mutation={rejectMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, legId: leg.id, reason: data.reason })}
    >
      <TextArea
        name="reason"
        label="Reason"
        placeholder="e.g. Missed the last two delivery dates — move these items to another supplier"
        description="Shown on the supplier's card and kept in the purchase's activity"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" loadingText="Rejecting...">
          Reject
        </Button>
      </DialogActions>
    </Form>
  );
};
