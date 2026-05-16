import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLineItem } from '@/hooks/stock-adjustments';
import { type AddStockAdjustmentLineItemFormData, addStockAdjustmentLineItemSchema } from '@/schemas/stock-adjustments';

const AddSerialForm = ({
  adjustmentId,
  lineId,
  suggestedSerial,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  lineId: string;
  suggestedSerial?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
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
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Done
        </Button>
        <Button type="submit">Save & Add Another</Button>
      </div>
    </Form>
  );
};

// Computes the next serial number based on the last added one.
// Heuristic: trailing digits become incremented.
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
  handle,
}: {
  adjustmentId: string;
  lineId: string | null;
  lastSerial?: string;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Add Serial"
    description="Type the serial. The form auto-resets so you can add several in a row."
    content={(close) =>
      lineId ? (
        <AddSerialForm
          adjustmentId={adjustmentId}
          lineId={lineId}
          suggestedSerial={suggestNextSerial(lastSerial)}
          onSuccess={close}
          onCancel={close}
        />
      ) : null
    }
  />
);
