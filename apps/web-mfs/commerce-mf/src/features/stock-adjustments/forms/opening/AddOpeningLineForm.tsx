import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
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
  stockAdjustmentLotId: string | null;
  tracking: InventoryTracking;
  // Locations already used by lines under this lot — excluded from the LocationSelector dropdown.
  excludeLocationIds?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddOpeningLineForm = ({
  adjustmentId,
  inventoryItemId,
  stockAdjustmentLotId,
  tracking,
  excludeLocationIds,
  onSuccess,
  onCancel,
}: AddOpeningLineFormProps) => {
  const isItem = tracking === 'serial' || tracking === 'lot_serial';

  const form = useForm<AddOpeningStockLineFormData>({
    resolver: zodResolver(addOpeningStockLineSchema),
    defaultValues: {
      stockAdjustmentLotId: stockAdjustmentLotId ?? undefined,
      locationId: '',
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
        quantity: Number(data.quantity || 0),
      })}
    >
      <LocationSelector
        name="locationId"
        label="Location"
        placeholder="Select location"
        params={{
          locationRoles: LocationRoleValues.STORAGE,
          inventoryItemId,
          ...(excludeLocationIds && excludeLocationIds.length > 0
            ? { excludeIds: excludeLocationIds.join(',') }
            : {}),
        }}
      />
      {!isItem && <TextField name="quantity" label="Quantity" type="number" positive nonZero />}
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
