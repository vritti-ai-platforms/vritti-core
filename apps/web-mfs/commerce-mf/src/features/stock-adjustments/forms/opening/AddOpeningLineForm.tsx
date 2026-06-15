import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddOpeningStockAdjustmentLine } from '@/hooks/stock-adjustments';
import { LocationRoleValues } from '@/schemas/locations';
import {
  type AddOpeningStockLineFormData,
  addOpeningStockLineSchema,
  type InventoryTracking,
} from '@/schemas/stock-adjustments';

interface AddOpeningLineFormProps {
  adjustmentId: string;
  inventoryItemId: string;
  primaryUomId: string;
  stockAdjustmentLotId: string | null;
  tracking: InventoryTracking;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddOpeningLineForm = ({
  adjustmentId,
  inventoryItemId,
  primaryUomId,
  stockAdjustmentLotId,
  tracking,
  onSuccess,
  onCancel,
}: AddOpeningLineFormProps) => {
  const isItem = tracking === 'serial' || tracking === 'lot_serial';
  const [allowDecimal, setAllowDecimal] = useState(true);
  // Serial-tracked items are restricted to the primary UOM at the BE; the selector is not shown
  // and we submit the primary UOM ID directly.

  const form = useForm<AddOpeningStockLineFormData>({
    resolver: zodResolver(addOpeningStockLineSchema),
    defaultValues: {
      stockAdjustmentLotId: stockAdjustmentLotId ?? undefined,
      locationId: '',
      uomId: primaryUomId,
      // For tracking='serial', quantity is derived from serials count — start at 0 (server will refresh).
      uomQty: 0,
    },
  });

  const mutation = useAddOpeningStockAdjustmentLine(adjustmentId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        stockAdjustmentLotId: stockAdjustmentLotId ?? undefined,
        locationId: data.locationId,
        uomId: data.uomId,
        uomQty: data.uomQty,
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
      <div className="grid grid-cols-2 gap-4">
        <TextField name="uomQty" label="Quantity" type="number" positive integer={isItem || !allowDecimal} />
        <UomSelector
          name="uomId"
          label="Unit"
          params={{ inventoryItemId }}
          disabled={isItem}
          onOptionSelect={(option) => setAllowDecimal(option?.additionals?.allowDecimal !== false)}
        />
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Line</Button>
      </DialogActions>
    </Form>
  );
};
