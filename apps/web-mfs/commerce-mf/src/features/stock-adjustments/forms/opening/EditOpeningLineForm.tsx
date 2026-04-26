import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useUpdateStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  type AddOpeningStockLineFormData,
  addOpeningStockLineSchema,
  type InventoryTracking,
  type StockAdjustmentLineData,
} from '@/schemas/stock-adjustments';

interface EditOpeningLineFormProps {
  adjustmentId: string;
  line: StockAdjustmentLineData;
  tracking: InventoryTracking;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditOpeningLineForm = ({
  adjustmentId,
  line,
  tracking,
  onSuccess,
  onCancel,
}: EditOpeningLineFormProps) => {
  const isItem = tracking === 'serial';
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
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
      {!isItem && <TextField name="quantity" label="Quantity" type="number" positive nonZero />}
      {isItem && (
        <p className="text-xs text-muted-foreground">
          Quantity is derived from the number of serials added to this line ({line.lineItemsCount}).
        </p>
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
