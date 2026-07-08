import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { ClipboardMinus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLineItem } from '@/hooks/stock-adjustments';
import { type AddStockAdjustmentLineItemFormData, addStockAdjustmentLineItemSchema } from '@/schemas/stock-adjustments';

const AddSerialForm = ({
  adjustmentId,
  lineId,
  suggestedSerial,
  lineItemsCount,
  quantity,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  lineId: string;
  suggestedSerial?: string;
  lineItemsCount?: number;
  quantity?: number;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const isLastSlot = lineItemsCount != null && quantity != null && lineItemsCount === quantity - 1;

  const form = useForm<AddStockAdjustmentLineItemFormData>({
    resolver: zodResolver(addStockAdjustmentLineItemSchema),
    defaultValues: { serialNumber: suggestedSerial ?? '' },
  });

  const mutation = useAddStockAdjustmentLineItem(adjustmentId, lineId, {
    onSuccess: () => {
      form.reset({ serialNumber: '' });
    },
  });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ serialNumber: data.serialNumber.trim() })}
    >
      <TextField name="serialNumber" label="Serial Number" placeholder="e.g. BOT-001" autoFocus />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" onClick={isLastSlot ? onSuccess : undefined}>
          {isLastSlot ? 'Save' : 'Save & Add Another'}
        </Button>
      </DialogActions>
    </Form>
  );
};

// Computes the next serial number by incrementing the trailing digits of the last one.
export const suggestNextSerial = (last: string | undefined): string | undefined => {
  if (!last) return undefined;
  const match = last.match(/^(.*?)(\d+)$/);
  if (!match) return undefined;
  const [, prefix, digits] = match;
  const next = (Number(digits) + 1).toString().padStart(digits.length, '0');
  return `${prefix}${next}`;
};

export const AddSerialDialog = ({
  adjustmentId,
  lineId,
  lastSerial,
  lineItemsCount,
  quantity,
  handle,
}: {
  adjustmentId: string;
  lineId: string | null;
  lastSerial?: string;
  lineItemsCount?: number;
  quantity?: number;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    icon={ClipboardMinus}
    title="Add Serial"
    description="Enter the serial number to register it under this line."
    content={(close) =>
      lineId ? (
        <AddSerialForm
          adjustmentId={adjustmentId}
          lineId={lineId}
          suggestedSerial={suggestNextSerial(lastSerial)}
          lineItemsCount={lineItemsCount}
          quantity={quantity}
          onSuccess={close}
          onCancel={close}
        />
      ) : null
    }
  />
);
