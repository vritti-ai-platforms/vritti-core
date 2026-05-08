import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useUpdateStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  type AddOpeningStockLineFormData,
  addOpeningStockLineSchema,
  type InventoryTracking,
  type StockAdjustmentLineData,
} from '@/schemas/stock-adjustments';
import { LocationRoleValues } from '@/schemas/locations';

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
  const form = useForm<AddOpeningStockLineFormData>({
    resolver: zodResolver(addOpeningStockLineSchema),
    defaultValues: {
      stockAdjustmentLotId: line.stockAdjustmentLotId ?? undefined,
      locationId: line.locationId ?? '',
      quantity: String(line.quantity ?? ''),
    },
  });

  const mutation = useUpdateStockAdjustmentLine(adjustmentId, line.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        locationId: data.locationId,
        ...(isItem ? {} : { quantity: Number(data.quantity || 0) }),
      })}
    >
      <LocationSelector
        name="locationId"
        label="Location"
        placeholder="Select location"
        params={{ locationRoles: LocationRoleValues.STORAGE, inventoryItemId }}
      />
      {!isItem && <TextField name="quantity" label="Quantity" type="number" positive nonZero />}
      {isItem && (
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
