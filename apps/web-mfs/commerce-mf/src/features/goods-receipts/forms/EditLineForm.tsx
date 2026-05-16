import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useUpdateGoodsReceiptLine } from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptLineFormData,
  addGoodsReceiptLineSchema,
  type GoodsReceiptLineData,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';
import { LocationRoleValues } from '@/schemas/locations';

interface EditLineFormProps {
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  line: GoodsReceiptLineData;
  tracking: InventoryTracking;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditLineForm = ({
  goodsReceiptId,
  itemId,
  inventoryItemId,
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
      quantity: line.quantity ?? 0,
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
        ...(isSerial ? {} : { quantity: data.quantity }),
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
      {!isSerial && <TextField name="quantity" label="Quantity" type="number" positive nonZero />}
      {isSerial && (
        <Alert
          variant="info"
          description={`Quantity is derived from the number of serials added to this line (${line.lineItemsCount}).`}
        />
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
