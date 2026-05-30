import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useAddGoodsReceiptLine } from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptLineFormData,
  buildAddGoodsReceiptLineSchema,
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
  allowDecimal: boolean;
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
  allowDecimal,
  poRemainingQuantity,
  onSuccess,
  onCancel,
}: AddLineFormProps) => {
  const isSerial = tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;

  const schema = useMemo(
    () => buildAddGoodsReceiptLineSchema({ allowDecimal, max: poRemainingQuantity ?? undefined }),
    [allowDecimal, poRemainingQuantity],
  );
  const form = useForm<AddGoodsReceiptLineFormData>({
    resolver: zodResolver(schema),
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
          excludeUsedOnGoodsReceiptItemId: itemId,
          ...(goodsReceiptLotId ? { goodsReceiptLotId } : {}),
        }}
      />
      <TextField
        name="quantity"
        label="Quantity"
        type="number"
        positive
        integer={!allowDecimal}
        max={poRemainingQuantity ?? undefined}
        description={isSerial ? 'The line is balanced once this many serials have been added.' : undefined}
      />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Line</Button>
      </div>
    </Form>
  );
};
