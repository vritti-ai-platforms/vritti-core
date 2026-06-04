import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdatePurchaseOrderNotes } from '@/hooks/purchase-orders';
import {
  type PurchaseOrderDetail,
  type UpdatePurchaseOrderNotesFormData,
  updatePurchaseOrderNotesSchema,
} from '@/schemas/purchase-orders';

interface UpdatePurchaseOrderNotesDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UpdatePurchaseOrderNotesDialog: React.FC<UpdatePurchaseOrderNotesDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdatePurchaseOrderNotesFormData>({
    resolver: zodResolver(updatePurchaseOrderNotesSchema),
    defaultValues: {
      notes: purchaseOrder.notes ?? '',
    },
  });

  const updateNotesMutation = useUpdatePurchaseOrderNotes({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateNotesMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        notes: data.notes?.trim() || null,
      })}
    >
      <TextArea name="notes" label="Notes" placeholder="Add notes" />
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Update Notes
        </Button>
      </div>
    </Form>
  );
};
