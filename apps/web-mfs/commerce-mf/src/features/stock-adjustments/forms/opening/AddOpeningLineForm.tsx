import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLine } from '@/hooks/stock-adjustments';
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
  // Serial-tracked items are restricted to the primary UOM at the BE; the selector is not shown
  // and we submit the primary UOM ID directly.

  const form = useForm<AddOpeningStockLineFormData>({
    resolver: zodResolver(addOpeningStockLineSchema),
    defaultValues: {
      stockAdjustmentLotId: stockAdjustmentLotId ?? undefined,
      locationId: '',
      uomId: primaryUomId,
      // For tracking='serial', quantity is derived from serials count — start at 0 (server will refresh).
      quantity: isItem ? '0' : '',
    },
  });

  const mutation = useAddStockAdjustmentLine(adjustmentId, { onSuccess });

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
        quantity: Number(data.quantity || 0),
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
      {!isItem && (
        <div className="grid grid-cols-2 gap-4">
          <TextField name="quantity" label="Quantity" type="number" positive nonZero />
          <UomSelector name="uomId" label="Unit" params={{ inventoryItemId }} />
        </div>
      )}
      {isItem && (
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
