import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCreateGoodsReceipt } from '@/hooks/useCreateGoodsReceipt';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface ReceiveGoodsDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

const receiveGoodsSchema = z
  .object({
    receivedDate: z.string().min(1, 'Received date is required'),
    notes: z.string().optional(),
  })
  .strict();

type ReceiveGoodsFormData = z.infer<typeof receiveGoodsSchema>;

export const ReceiveGoodsDialog: React.FC<ReceiveGoodsDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ReceiveGoodsFormData>({
    resolver: zodResolver(receiveGoodsSchema),
    defaultValues: {
      receivedDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const createMutation = useCreateGoodsReceipt(purchaseOrder.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: purchaseOrder.supplierId,
        purchaseOrderId: purchaseOrder.id,
        receivedDate: data.receivedDate,
        notes: data.notes || undefined,
      })}
    >
      <TextField name="receivedDate" label="Received Date" type="date" />
      <TextArea name="notes" label="Receipt Notes" placeholder="Optional notes about this delivery" />
      <p className="text-sm text-muted-foreground">A draft goods receipt will be created. Add line items in the detail page.</p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </div>
    </Form>
  );
};
