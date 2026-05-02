import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useAddGoodsReceiptLine } from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptLineFormData,
  addGoodsReceiptLineSchema,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';

interface AddLineFormProps {
  goodsReceiptId: string;
  itemId: string;
  goodsReceiptLotId: string | null;
  tracking: InventoryTracking;
  poRemainingQuantity: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddLineForm = ({
  goodsReceiptId,
  itemId,
  goodsReceiptLotId,
  tracking,
  poRemainingQuantity,
  onSuccess,
  onCancel,
}: AddLineFormProps) => {
  const isSerial = tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;

  const form = useForm<AddGoodsReceiptLineFormData>({
    resolver: zodResolver(addGoodsReceiptLineSchema),
    defaultValues: {
      goodsReceiptLotId: goodsReceiptLotId ?? undefined,
      locationId: '',
      quantity: isSerial ? '0' : '',
    },
  });
  const mutation = useAddGoodsReceiptLine(goodsReceiptId, itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        goodsReceiptLotId: goodsReceiptLotId ?? undefined,
        locationId: data.locationId,
        quantity: Number(data.quantity || 0),
      })}
    >
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
      {!isSerial && (
        <TextField
          name="quantity"
          label="Quantity"
          type="number"
          positive
          nonZero
          description={
            poRemainingQuantity != null ? `Up to ${poRemainingQuantity} remaining on the linked PO.` : undefined
          }
        />
      )}
      {isSerial && (
        <p className="text-xs text-muted-foreground">
          Quantity is derived from the number of serials added to this line.
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Line</Button>
      </div>
    </Form>
  );
};
