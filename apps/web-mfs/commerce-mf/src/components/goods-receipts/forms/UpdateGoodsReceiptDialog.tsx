import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
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

// Edits a draft receipt's notes and, when the receipt created its inbound delivery, the supplier's delivery note on it; an announced delivery's note is edited on that delivery
export const UpdateGoodsReceiptDialog: React.FC<UpdateGoodsReceiptDialogProps> = ({
  useUpdate,
  receipt,
  onSuccess,
  onCancel,
}) => {
  const ownsDeliveryNote = receipt.deliverySource === 'RECEIPT';
  const form = useForm<UpdateGoodsReceiptFormData>({
    resolver: zodResolver(updateGoodsReceiptSchema),
    defaultValues: {
      supplierDeliveryNoteNumber: receipt.supplierDeliveryNoteNumber ?? '',
      supplierDeliveryNoteDate: receipt.supplierDeliveryNoteDate,
      notes: receipt.notes ?? '',
    },
  });
  const updateMutation = useUpdate(receipt.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        ...(ownsDeliveryNote
          ? {
              supplierDeliveryNoteNumber: data.supplierDeliveryNoteNumber.trim() || null,
              supplierDeliveryNoteDate: data.supplierDeliveryNoteDate || null,
            }
          : {}),
        notes: data.notes.trim() || null,
      })}
    >
      {ownsDeliveryNote && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            name="supplierDeliveryNoteNumber"
            label="Supplier Delivery Note No."
            placeholder="Optional challan number"
          />
          <DatePicker name="supplierDeliveryNoteDate" label="Delivery Note Date" />
        </div>
      )}
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
