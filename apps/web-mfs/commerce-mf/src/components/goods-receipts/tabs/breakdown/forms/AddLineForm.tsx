import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { buildGoodsReceiptLineSchema, type GoodsReceiptLineFormData } from '@/schemas/goods-receipts';
import { type InventoryTracking, InventoryTrackingValues } from '@/schemas/inventory-items';
import { LocationRoleValues } from '@/schemas/locations';
import { LocationSelector } from '@/selectors/location';
import type { GoodsReceiptsBinding } from '../../../bindings';

interface AddLineFormProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  goodsReceiptLotId: string | null;
  tracking: InventoryTracking;
  allowDecimal: boolean;
  undistributedQty: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// Puts part of the item's accepted quantity away at a storage location, up to what is still undistributed
export const AddLineForm: React.FC<AddLineFormProps> = ({
  binding,
  goodsReceiptId,
  itemId,
  inventoryItemId,
  goodsReceiptLotId,
  tracking,
  allowDecimal,
  undistributedQty,
  onSuccess,
  onCancel,
}) => {
  const fmt = useFormatters();
  const isSerialTracked =
    tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;
  const schema = useMemo(
    () => buildGoodsReceiptLineSchema({ allowDecimal, max: undistributedQty }),
    [allowDecimal, undistributedQty],
  );
  const form = useForm<GoodsReceiptLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 0 },
  });
  const mutation = binding.useAddLine(goodsReceiptId, itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        goodsReceiptLotId,
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
        max={undistributedQty}
        description={
          isSerialTracked
            ? 'The line is balanced once this many serials have been added.'
            : `${fmt.number(undistributedQty).primary} still to put away`
        }
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Line</Button>
      </DialogActions>
    </Form>
  );
};
