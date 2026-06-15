import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { ClipboardMinus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateChangeStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  buildUpdateChangeLineSchema,
  type InventoryTracking,
  type StockAdjustmentLineData,
  type StockAdjustmentType,
  StockAdjustmentTypeValues,
  type UpdateChangeLineFormData,
} from '@/schemas/stock-adjustments';

// Edit allows changing quantity + UOM; quant binding cannot change after creation.
export const EditChangeLineForm = ({
  adjustmentId,
  inventoryItemId,
  line,
  tracking,
  adjustmentType,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  inventoryItemId: string;
  line: StockAdjustmentLineData;
  tracking: InventoryTracking;
  adjustmentType: StockAdjustmentType;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const isItem = tracking === 'serial' || tracking === 'lot_serial';
  const isCorrection = adjustmentType === StockAdjustmentTypeValues.CORRECTION;
  const [allowDecimal, setAllowDecimal] = useState(true);

  const resolver = useMemo(() => zodResolver(buildUpdateChangeLineSchema({ isCorrection })), [isCorrection]);

  const form = useForm<UpdateChangeLineFormData>({
    resolver,
    defaultValues: { uomQty: line.uomQty ?? 0, uomId: line.uomId },
  });

  const mutation = useUpdateChangeStockAdjustmentLine(adjustmentId, line.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ uomQty: data.uomQty, uomId: data.uomId })}
    >
      <p className="text-sm">
        <span className="text-muted-foreground">Quant:</span> {line.quantLotNumber ? `${line.quantLotNumber} @ ` : ''}
        {line.quantLocationName ?? line.quantLocationId ?? '—'}
      </p>
      {!isItem ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              name="uomQty"
              label="Quantity"
              type="number"
              positive={!isCorrection}
              nonZero={!isCorrection}
              integer={!allowDecimal}
            />
            <UomSelector
              name="uomId"
              label="Unit"
              params={{ inventoryItemId }}
              onOptionSelect={(option) => setAllowDecimal(option?.additionals?.allowDecimal !== false)}
            />
          </div>
          {isCorrection && (
            <p className="text-xs text-muted-foreground">Positive quantity adds to the quant; negative deducts.</p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Quantity is derived from the number of serials picked ({line.lineItemsCount}).
        </p>
      )}

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        {!isItem && (
          <Button type="submit" loadingText="Saving...">
            Save
          </Button>
        )}
      </DialogActions>
    </Form>
  );
};

export const EditChangeLineDialog = ({
  adjustmentId,
  inventoryItemId,
  line,
  tracking,
  adjustmentType,
  handle,
}: {
  adjustmentId: string;
  inventoryItemId: string;
  line: StockAdjustmentLineData | null;
  tracking: InventoryTracking;
  adjustmentType: StockAdjustmentType;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    icon={ClipboardMinus}
    title="Edit Line"
    description="Update the quantity for this line."
    content={(close) =>
      line ? (
        <EditChangeLineForm
          adjustmentId={adjustmentId}
          inventoryItemId={inventoryItemId}
          line={line}
          tracking={tracking}
          adjustmentType={adjustmentType}
          onSuccess={close}
          onCancel={close}
        />
      ) : null
    }
  />
);
