import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateGoodsReceiptLine } from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptLineFormData,
  buildAddGoodsReceiptLineSchema,
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
  // For Edit, the line's own current quantity is part of the PO usage; the effective max for the
  // editor is `poRemaining + line.quantity` so the user can hold steady or shift quantity around.
  const effectiveMax = useMemo(() => {
    if (poRemainingQuantity == null) return undefined;
    return poRemainingQuantity + (line.quantity ?? 0);
  }, [poRemainingQuantity, line.quantity]);
  // For serial-tracked lines, quantity can never drop below the count of serials already attached —
  // otherwise the line would be in a state count > quantity with no valid path to balanced.
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
