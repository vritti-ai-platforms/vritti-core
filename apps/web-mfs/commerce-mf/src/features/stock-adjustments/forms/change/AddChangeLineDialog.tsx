import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { QuantSelector } from '@vritti/quantum-ui/selects/quant';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { ClipboardMinus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddChangeStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  type AddChangeLineFormData,
  buildAddChangeLineSchema,
  type InventoryTracking,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
} from '@/schemas/stock-adjustments';

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
  const [uomPair, setUomPair] = useState({ primaryUomQty: 1, uomQty: 1 });
  const [allowDecimal, setAllowDecimal] = useState(true);

  const maxQty =
    !isCorrection && availableQty != null ? (availableQty * uomPair.primaryUomQty) / uomPair.uomQty : undefined;

  const resolver = useMemo(
    () => zodResolver(buildAddChangeLineSchema({ isCorrection, maxQty })),
    [maxQty, isCorrection],
  );

  const form = useForm<AddChangeLineFormData>({
    resolver,
    defaultValues: { quantId: '', uomId: primaryUomId, uomQty: 0 },
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
        uomQty: data.uomQty,
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
          name="uomQty"
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
            const p = option?.additionals?.primaryUomQty;
            const u = option?.additionals?.uomQty;
            setUomPair({
              primaryUomQty: p != null ? Number(p) : 1,
              uomQty: u != null && Number(u) !== 0 ? Number(u) : 1,
            });
            setAllowDecimal(option?.additionals?.allowDecimal !== false);
          }}
        />
      </div>
      {isCorrection && !isItem && (
        <p className="text-xs text-muted-foreground">Positive quantity adds to the quant; negative deducts.</p>
      )}
      {isItem && <p className="text-xs text-muted-foreground">Pick serials to fulfill the quantity above.</p>}

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Line</Button>
      </DialogActions>
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
    icon={ClipboardMinus}
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
