import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useUpdateGoodsReceiptLine } from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptLineFormData,
  addGoodsReceiptLineSchema,
  type GoodsReceiptLineData,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';

interface EditLineFormProps {
  goodsReceiptId: string;
  itemId: string;
  line: GoodsReceiptLineData;
  tracking: InventoryTracking;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditLineForm = ({
  goodsReceiptId,
  itemId,
  line,
  tracking,
  onSuccess,
  onCancel,
}: EditLineFormProps) => {
  const isSerial = tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;
  const form = useForm<AddGoodsReceiptLineFormData>({
    resolver: zodResolver(addGoodsReceiptLineSchema),
    defaultValues: {
      goodsReceiptLotId: line.goodsReceiptLotId ?? undefined,
      locationId: line.locationId,
      quantity: String(line.quantity ?? ''),
    },
  });
  const mutation = useUpdateGoodsReceiptLine(goodsReceiptId, itemId, line.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        locationId: data.locationId,
        ...(isSerial ? {} : { quantity: Number(data.quantity || 0) }),
      })}
    >
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
      {!isSerial && <TextField name="quantity" label="Quantity" type="number" positive nonZero />}
      {isSerial && (
        <p className="text-xs text-muted-foreground">
          Quantity is derived from the number of serials added to this line ({line.lineItemsCount}).
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </div>
    </Form>
  );
};
