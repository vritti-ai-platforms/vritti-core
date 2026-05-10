import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { BatchSelector } from '@vritti/quantum-ui/selects/batch';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  type AddChangeLineFormData,
  addChangeLineSchema,
  type InventoryTracking,
} from '@/schemas/stock-adjustments';

const AddChangeLineForm = ({
  adjustmentId,
  inventoryItemId,
  primaryUomId,
  tracking,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  inventoryItemId: string;
  primaryUomId: string;
  tracking: InventoryTracking;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const isItem = tracking === 'serial' || tracking === 'lot_serial';

  const form = useForm<AddChangeLineFormData>({
    resolver: zodResolver(addChangeLineSchema),
    defaultValues: { quantId: '', uomId: primaryUomId, quantity: isItem ? '0' : '' },
  });

  const mutation = useAddStockAdjustmentLine(adjustmentId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        quantId: data.quantId,
        uomId: data.uomId,
        quantity: Number(data.quantity || 0),
      })}
    >
      <BatchSelector
        name="quantId"
        label="Quant (Lot @ Location)"
        placeholder="Pick the quant to deduct from"
        inventoryItemId={inventoryItemId}
      />
      {!isItem && (
        <div className="grid grid-cols-2 gap-4">
          <TextField name="quantity" label="Quantity" type="number" positive nonZero />
          <UomSelector name="uomId" label="Unit" params={{ inventoryItemId }} />
        </div>
      )}
      {isItem && (
        <p className="text-xs text-muted-foreground">
          Quantity is derived from the number of serials picked under this line.
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

export const AddChangeLineDialog = ({
  adjustmentId,
  inventoryItemId,
  primaryUomId,
  tracking,
  handle,
}: {
  adjustmentId: string;
  inventoryItemId: string;
  primaryUomId: string;
  tracking: InventoryTracking;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Add Line"
    description="Pick the quant to deduct from and enter the quantity."
    content={(close) => (
      <AddChangeLineForm
        adjustmentId={adjustmentId}
        inventoryItemId={inventoryItemId}
        primaryUomId={primaryUomId}
        tracking={tracking}
        onSuccess={close}
        onCancel={close}
      />
    )}
  />
);
