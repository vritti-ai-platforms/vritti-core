import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useAddGoodsReceiptLine } from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptLineFormData,
  addGoodsReceiptLineSchema,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';
import { LocationRoleValues } from '@/schemas/locations';

interface AddLineFormProps {
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  goodsReceiptLotId: string | null;
  tracking: InventoryTracking;
  poRemainingQuantity: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddLineForm = ({
  goodsReceiptId,
  itemId,
  inventoryItemId,
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
      quantity: 0,
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
        quantity: data.quantity,
      })}
    >
      <LocationSelector
        name="locationId"
        label="Location"
        placeholder="Select location"
        params={{
          locationRoles: `${LocationRoleValues.STORAGE},${LocationRoleValues.RESERVED_STORAGE}`,
          inventoryItemId,
        }}
      />
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
        <Alert variant="info" description="Quantity is derived from the number of serials added to this line." />
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
