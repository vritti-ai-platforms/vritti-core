import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { QuantSelector } from '@vritti/quantum-ui/selects/quant';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddChangeStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  type InventoryTracking,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
} from '@/schemas/stock-adjustments';

type FormData = { quantId: string; uomId: string; quantity: number };

const AddChangeLineForm = ({
  adjustmentId,
  inventoryItemId,
  primaryUomId,
  tracking,
  adjustmentType,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  inventoryItemId: string;
  primaryUomId: string;
  tracking: InventoryTracking;
  adjustmentType: StockAdjustmentType;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const isItem = tracking === 'serial' || tracking === 'lot_serial';
  const isCorrection = adjustmentType === StockAdjustmentTypeValues.CORRECTION;

  const [availableQty, setAvailableQty] = useState<number | null>(null);
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(1);
  const [allowDecimal, setAllowDecimal] = useState(true);

  const maxQty = !isCorrection && availableQty != null ? (availableQty * numerator) / denominator : undefined;

  const resolver = useMemo(() => {
    const schema = z.object({
      quantId: z.string().min(1, 'Quant is required'),
      uomId: z.string().min(1, 'UOM is required'),
      quantity: isCorrection
        ? zodNumericField({ required: 'Quantity is required', nonZero: true })
        : zodNumericField({ required: 'Quantity is required', positive: true, max: maxQty }),
    });
    return zodResolver(schema);
  }, [maxQty, isCorrection]);

  const form = useForm<FormData>({
    resolver,
    defaultValues: { quantId: '', uomId: primaryUomId, quantity: 0 },
  });

  const mutation = useAddChangeStockAdjustmentLine(adjustmentId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        quantId: data.quantId,
        uomId: data.uomId,
        quantity: data.quantity,
      })}
    >
      <QuantSelector
        name="quantId"
        label="Quant (Lot @ Location)"
        placeholder="Pick the quant"
        params={{ inventoryItemId }}
        onOptionSelect={(option) => {
          const qty = option?.additionals?.quantity;
          setAvailableQty(qty != null ? Number(qty) : null);
        }}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          name="quantity"
          label="Quantity"
          type="number"
          positive={!isCorrection}
          nonZero
          integer={!allowDecimal}
          max={maxQty}
        />
        <UomSelector
          name="uomId"
          label="Unit"
          params={{ inventoryItemId }}
          disabled={isItem}
          onOptionSelect={(option) => {
            const n = option?.additionals?.numerator;
            const d = option?.additionals?.denominator;
            setNumerator(n != null ? Number(n) : 1);
            setDenominator(d != null && Number(d) !== 0 ? Number(d) : 1);
            setAllowDecimal(option?.additionals?.allowDecimal !== false);
          }}
        />
      </div>
      {isCorrection && !isItem && (
        <p className="text-xs text-muted-foreground">Positive quantity adds to the quant; negative deducts.</p>
      )}
      {isItem && (
        <p className="text-xs text-muted-foreground">Pick serials to fulfill the quantity above.</p>
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
  adjustmentType,
  handle,
}: {
  adjustmentId: string;
  inventoryItemId: string;
  primaryUomId: string;
  tracking: InventoryTracking;
  adjustmentType: StockAdjustmentType;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Add Line"
    description="Pick a quant and enter the quantity for this line."
    content={(close) => (
      <AddChangeLineForm
        adjustmentId={adjustmentId}
        inventoryItemId={inventoryItemId}
        primaryUomId={primaryUomId}
        tracking={tracking}
        adjustmentType={adjustmentType}
        onSuccess={close}
        onCancel={close}
      />
    )}
  />
);
