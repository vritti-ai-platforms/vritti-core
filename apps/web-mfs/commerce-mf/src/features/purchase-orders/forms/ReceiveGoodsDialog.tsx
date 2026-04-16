import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
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

const receiveGoodsSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      purchaseOrderItemId: z.string(),
      acceptedQuantity: z.string(),
      rejectedQuantity: z.string(),
      rejectionReason: z.string().optional(),
      batchNumber: z.string().optional(),
      manufacturingDate: z.string().optional(),
      expiryDate: z.string().optional(),
    }),
  ),
});

type ReceiveGoodsFormData = z.infer<typeof receiveGoodsSchema>;

export const ReceiveGoodsDialog: React.FC<ReceiveGoodsDialogProps> = ({ purchaseOrder, onSuccess, onCancel }) => {
  const receivableItems = purchaseOrder.items.filter((item) => item.receivedQuantity < item.orderedQuantity);

  const form = useForm<ReceiveGoodsFormData>({
    resolver: zodResolver(receiveGoodsSchema),
    defaultValues: {
      locationId: undefined,
      notes: '',
      items: receivableItems.map((item) => ({
        purchaseOrderItemId: item.id,
        acceptedQuantity: '',
        rejectedQuantity: '0',
        rejectionReason: '',
        batchNumber: '',
        manufacturingDate: '',
        expiryDate: '',
      })),
    },
  });

  const createMutation = useCreateGoodsReceipt(purchaseOrder.id, { onSuccess });

  if (receivableItems.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-muted-foreground">All items have been fully received.</p>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form
      form={form}
      mutation={createMutation}
     
      onCancel={onCancel}
      transformSubmit={(data) => ({
        purchaseOrderId: purchaseOrder.id,
        locationId: data.locationId,
        notes: data.notes || undefined,
        items: data.items
          .filter((item) => Number(item.acceptedQuantity) > 0 || Number(item.rejectedQuantity) > 0)
          .map((item) => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            acceptedQuantity: Number(item.acceptedQuantity) || 0,
            rejectedQuantity: Number(item.rejectedQuantity) || 0,
            rejectionReason: item.rejectionReason || undefined,
            batchNumber: item.batchNumber || undefined,
            manufacturingDate: item.manufacturingDate || undefined,
            expiryDate: item.expiryDate || undefined,
          })),
      })}
    >
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
      <div className="space-y-6">
        {receivableItems.map((item, index) => (
          <div key={item.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{item.inventoryItemName ?? item.inventoryItemId}</p>
              <p className="text-sm text-muted-foreground">
                Ordered: {item.orderedQuantity} | Received: {item.receivedQuantity} | Remaining:{' '}
                {item.orderedQuantity - item.receivedQuantity}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField name={`items.${index}.acceptedQuantity`} label="Accepted Qty" type="number" placeholder="0" />
              <TextField name={`items.${index}.rejectedQuantity`} label="Rejected Qty" type="number" placeholder="0" />
            </div>
            <TextField
              name={`items.${index}.rejectionReason`}
              label="Rejection Reason"
              placeholder="Reason for rejection (if any)"
            />
            <TextField
              name={`items.${index}.batchNumber`}
              label="Batch / Lot Number"
              placeholder="Supplier's lot number (optional)"
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField name={`items.${index}.manufacturingDate`} label="Mfg Date" type="date" />
              <TextField name={`items.${index}.expiryDate`} label="Expiry Date" type="date" />
            </div>
          </div>
        ))}
      </div>
      <TextArea name="notes" label="Receipt Notes" placeholder="Optional notes about this delivery" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Recording...">
          Record Receipt
        </Button>
      </div>
    </Form>
  );
};
