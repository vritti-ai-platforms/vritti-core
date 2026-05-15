import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { QuantSelector } from '@vritti/quantum-ui/selects/quant';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLine } from '@/hooks/stock-adjustments';
import { type AddChangeLineFormData, addChangeLineSchema, type InventoryTracking } from '@/schemas/stock-adjustments';

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

  const [availableQty, setAvailableQty] = useState<number | null>(null);
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(1);

  const maxQty = availableQty != null ? (availableQty * numerator) / denominator : undefined;

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
      <QuantSelector
        name="quantId"
        label="Quant (Lot @ Location)"
        placeholder="Pick the quant to deduct from"
        params={{ inventoryItemId }}
        onOptionSelect={(option) => {
          const qty = option?.additionals?.quantity;
          setAvailableQty(qty != null ? Number(qty) : null);
        }}
      />
      {!isItem && (
        <div className="grid grid-cols-2 gap-4">
          <TextField name="quantity" label="Quantity" type="number" positive nonZero max={maxQty} />
          <UomSelector
            name="uomId"
            label="Unit"
            params={{ inventoryItemId }}
            onOptionSelect={(option) => {
              const n = option?.additionals?.numerator;
              const d = option?.additionals?.denominator;
              setNumerator(n != null ? Number(n) : 1);
              setDenominator(d != null && Number(d) !== 0 ? Number(d) : 1);
            }}
          />
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
