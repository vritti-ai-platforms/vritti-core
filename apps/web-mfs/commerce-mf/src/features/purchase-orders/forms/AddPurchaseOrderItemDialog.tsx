import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUpdatePurchaseOrder } from '@/hooks/useUpdatePurchaseOrder';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface AddPurchaseOrderItemDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

const addLineItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Item is required'),
  orderedQuantity: z.string().min(1, 'Quantity is required'),
});

type AddLineItemFormData = z.infer<typeof addLineItemSchema>;

export const AddPurchaseOrderItemDialog: React.FC<AddPurchaseOrderItemDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddLineItemFormData>({
    resolver: zodResolver(addLineItemSchema),
    defaultValues: {
      inventoryItemId: '',
      orderedQuantity: '',
    },
  });

  const updateMutation = useUpdatePurchaseOrder({ onSuccess });

  const existingItemIds = purchaseOrder.items.map((i) => i.inventoryItemId).join(',');

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        data: {
          items: [
            ...purchaseOrder.items.map((i) => ({
              inventoryItemId: i.inventoryItemId,
              orderedQuantity: i.orderedQuantity,
            })),
            {
              inventoryItemId: data.inventoryItemId,
              orderedQuantity: Number(data.orderedQuantity),
            },
          ],
        },
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        params={{ excludeIds: existingItemIds }}
      />
      <TextField name="orderedQuantity" label="Ordered Quantity" type="number" placeholder="e.g. 500" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Line Item
        </Button>
      </div>
    </Form>
  );
};
