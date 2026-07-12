import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  type AddGoodsReceiptLineFormData,
  buildAddGoodsReceiptLineSchema,
  type GoodsReceiptLineData,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';
import { LocationRoleValues } from '@/schemas/locations';
import { useUpdateGoodsReceiptLine } from '@/hooks/site/goods-receipts';

interface EditLineFormProps {
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  line: GoodsReceiptLineData;
  tracking: InventoryTracking;
  allowDecimal: boolean;
  poRemainingQuantity?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditLineForm = ({
  goodsReceiptId,
  itemId,
  inventoryItemId,
  line,
  tracking,
  allowDecimal,
  poRemainingQuantity,
  onSuccess,
  onCancel,
}: EditLineFormProps) => {
  const isSerial = tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;
  // The line's own quantity counts toward PO usage, so the editor's effective max is `poRemaining + line.quantity`.
  const effectiveMax = useMemo(() => {
    if (poRemainingQuantity == null) return undefined;
    return poRemainingQuantity + (line.quantity ?? 0);
  }, [poRemainingQuantity, line.quantity]);
  // Serial-tracked lines can't drop quantity below the count of serials already attached.
  const minQty = isSerial ? line.lineItemsCount : undefined;
  const schema = useMemo(
    () => buildAddGoodsReceiptLineSchema({ allowDecimal, min: minQty, max: effectiveMax }),
    [allowDecimal, minQty, effectiveMax],
  );
  const form = useForm<AddGoodsReceiptLineFormData>({
    resolver: zodResolver(schema),
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
          ...(line.goodsReceiptLotId ? { goodsReceiptLotId: line.goodsReceiptLotId } : {}),
        }}
      />
      <TextField
        name="quantity"
        label="Quantity"
        type="number"
        positive
        integer={!allowDecimal}
        min={minQty}
        max={effectiveMax}
      />

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </DialogActions>
    </Form>
  );
};
