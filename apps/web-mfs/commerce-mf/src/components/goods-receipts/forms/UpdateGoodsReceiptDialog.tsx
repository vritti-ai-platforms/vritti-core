import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type GoodsReceiptData,
  type UpdateGoodsReceiptFormData,
  updateGoodsReceiptSchema,
} from '@/schemas/goods-receipts';
import type { UseUpdateGoodsReceipt } from '../types';

interface UpdateGoodsReceiptDialogProps {
  useUpdate: UseUpdateGoodsReceipt;
  receipt: GoodsReceiptData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Edits a draft receipt's notes; the supplier's delivery note belongs to its inbound delivery and is edited there
export const UpdateGoodsReceiptDialog: React.FC<UpdateGoodsReceiptDialogProps> = ({
  useUpdate,
  receipt,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateGoodsReceiptFormData>({
    resolver: zodResolver(updateGoodsReceiptSchema),
    defaultValues: { notes: receipt.notes ?? '' },
  });
  const updateMutation = useUpdate(receipt.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({ notes: data.notes.trim() || null })}
    >
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
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
