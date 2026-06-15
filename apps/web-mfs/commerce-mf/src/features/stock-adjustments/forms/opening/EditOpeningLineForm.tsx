import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateOpeningStockAdjustmentLine } from '@/hooks/stock-adjustments';
import { LocationRoleValues } from '@/schemas/locations';
import {
  type AddOpeningStockLineFormData,
  addOpeningStockLineSchema,
  type InventoryTracking,
  type StockAdjustmentLineData,
} from '@/schemas/stock-adjustments';

interface EditOpeningLineFormProps {
  adjustmentId: string;
  inventoryItemId: string;
  line: StockAdjustmentLineData;
  tracking: InventoryTracking;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditOpeningLineForm = ({
  adjustmentId,
  inventoryItemId,
  line,
  tracking,
  onSuccess,
  onCancel,
}: EditOpeningLineFormProps) => {
  const isItem = tracking === 'serial' || tracking === 'lot_serial';
  const [allowDecimal, setAllowDecimal] = useState(true);

  const form = useForm<AddOpeningStockLineFormData>({
    resolver: zodResolver(addOpeningStockLineSchema),
    defaultValues: {
      stockAdjustmentLotId: line.stockAdjustmentLotId ?? undefined,
      locationId: line.locationId ?? '',
      uomId: line.uomId,
      uomQty: line.uomQty ?? 0,
    },
  });

  const mutation = useUpdateOpeningStockAdjustmentLine(adjustmentId, line.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        locationId: data.locationId,
        uomQty: data.uomQty,
        ...(isItem ? {} : { uomId: data.uomId }),
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
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </DialogActions>
    </Form>
  );
};
