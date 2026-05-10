import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUpdateStockAdjustmentLine } from '@/hooks/stock-adjustments';
import type { InventoryTracking, StockAdjustmentLineData } from '@/schemas/stock-adjustments';

// Edit allows changing quantity + UOM; quant binding cannot change after creation.
const schema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
  uomId: z.string().min(1, 'UOM is required'),
});
type FormData = z.infer<typeof schema>;

const EditChangeLineForm = ({
  adjustmentId,
  inventoryItemId,
  line,
  tracking,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  inventoryItemId: string;
  line: StockAdjustmentLineData;
  tracking: InventoryTracking;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const isItem = tracking === 'serial' || tracking === 'lot_serial';

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: String(line.quantity ?? ''), uomId: line.uomId },
  });

  const mutation = useUpdateStockAdjustmentLine(adjustmentId, line.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ quantity: Number(data.quantity || 0), uomId: data.uomId })}
    >
      <p className="text-sm">
        <span className="text-muted-foreground">Quant:</span>{' '}
        {line.quantLotNumber ? `${line.quantLotNumber} @ ` : ''}
        {line.quantLocationName ?? line.quantLocationId ?? '—'}
      </p>
      {!isItem ? (
        <div className="grid grid-cols-2 gap-4">
          <TextField name="quantity" label="Quantity" type="number" positive nonZero />
          <UomSelector name="uomId" label="Unit" params={{ inventoryItemId }} />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Quantity is derived from the number of serials picked ({line.lineItemsCount}).
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        {!isItem && (
          <Button type="submit" loadingText="Saving...">
            Save
          </Button>
        )}
      </div>
    </Form>
  );
};

export const EditChangeLineDialog = ({
  adjustmentId,
  inventoryItemId,
  line,
  tracking,
  handle,
}: {
  adjustmentId: string;
  inventoryItemId: string;
  line: StockAdjustmentLineData | null;
  tracking: InventoryTracking;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Edit Line"
    description="Update the quantity for this line."
    content={(close) =>
      line ? (
        <EditChangeLineForm
          adjustmentId={adjustmentId}
          inventoryItemId={inventoryItemId}
          line={line}
          tracking={tracking}
          onSuccess={close}
          onCancel={close}
        />
      ) : null
    }
  />
);
