import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  buildGoodsReceiptLineSchema,
  type GoodsReceiptLineData,
  type GoodsReceiptLineFormData,
} from '@/schemas/goods-receipts';
import { type InventoryTracking, InventoryTrackingValues } from '@/schemas/inventory-items';
import { LocationRoleValues } from '@/schemas/locations';
import { LocationSelector } from '@/selectors/location';
import type { GoodsReceiptsBinding } from '../../../bindings';

interface EditLineFormProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  line: GoodsReceiptLineData;
  tracking: InventoryTracking;
  allowDecimal: boolean;
  undistributedQty: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// Moves a line to another location or changes its quantity; a serial-tracked line keeps at least its serials
export const EditLineForm: React.FC<EditLineFormProps> = ({
  binding,
  goodsReceiptId,
  itemId,
  inventoryItemId,
  line,
  tracking,
  allowDecimal,
  undistributedQty,
  onSuccess,
  onCancel,
}) => {
  const isSerialTracked =
    tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;
  // The line's own quantity is already distributed, so it can grow by what is still undistributed
  const maxQty = undistributedQty + line.quantity;
  const minQty = isSerialTracked ? line.lineItemsCount : undefined;
  const schema = useMemo(
    () => buildGoodsReceiptLineSchema({ allowDecimal, min: minQty, max: maxQty }),
    [allowDecimal, minQty, maxQty],
  );
  const form = useForm<GoodsReceiptLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      goodsReceiptLotId: line.goodsReceiptLotId ?? undefined,
      locationId: line.locationId,
      quantity: line.quantity,
    },
  });
  const mutation = binding.useUpdateLine(goodsReceiptId, itemId, line.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ locationId: data.locationId, quantity: data.quantity })}
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
        max={maxQty}
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
