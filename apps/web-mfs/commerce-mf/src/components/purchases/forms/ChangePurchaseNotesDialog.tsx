import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type PurchaseDetail, type PurchaseNotesFormData, purchaseNotesSchema } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';

interface ChangePurchaseNotesDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes the purchase's notes; clearing them removes the note
export const ChangePurchaseNotesDialog: React.FC<ChangePurchaseNotesDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<PurchaseNotesFormData>({
    resolver: zodResolver(purchaseNotesSchema),
    defaultValues: { notes: purchase.notes ?? '' },
  });
  const changeMutation = binding.useChangeNotes({ onSuccess });

  return (
    <Form
      form={form}
      mutation={changeMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, notes: data.notes.trim() || null })}
    >
      <TextArea name="notes" label="Notes" placeholder="Anything others working on this purchase should know" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Notes
        </Button>
      </DialogActions>
    </Form>
  );
};
