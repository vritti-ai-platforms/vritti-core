import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUpdatePurchaseOrderItem } from '@/hooks/purchase-orders';
import type { PurchaseOrderItemData } from '@/schemas/purchase-orders';

interface UpdatePurchaseOrderItemDialogProps {
  purchaseOrderId: string;
  item: PurchaseOrderItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

const updateLineItemSchema = z.object({
  orderedQuantity: z.string().min(1, 'Quantity is required'),
});

type UpdateLineItemFormData = z.infer<typeof updateLineItemSchema>;

export const UpdatePurchaseOrderItemDialog: React.FC<UpdatePurchaseOrderItemDialogProps> = ({
  purchaseOrderId,
  item,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateLineItemFormData>({
    resolver: zodResolver(updateLineItemSchema),
    defaultValues: {
      orderedQuantity: String(item.orderedQuantity),
    },
  });
  const mutation = useUpdatePurchaseOrderItem({ onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrderId,
        itemId: item.id,
        orderedQuantity: Number(data.orderedQuantity),
      })}
    >
      <TextField name="orderedQuantity" label="Ordered Quantity" type="number" placeholder="e.g. 500" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Update Line Item
        </Button>
      </div>
    </Form>
  );
};
