import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  type AddOpeningStockLineFormData,
  addOpeningStockLineSchema,
  type InventoryTracking,
} from '@/schemas/stock-adjustments';

interface AddOpeningLineFormProps {
  adjustmentId: string;
  stockAdjustmentLotId: string | null;
  tracking: InventoryTracking;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddOpeningLineForm = ({
  adjustmentId,
  stockAdjustmentLotId,
  tracking,
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
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
      {!isItem && <TextField name="quantity" label="Quantity" type="number" positive nonZero />}
      {isItem && (
        <p className="text-xs text-muted-foreground">
          Quantity is derived from the number of serials added to this line.
        </p>
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
