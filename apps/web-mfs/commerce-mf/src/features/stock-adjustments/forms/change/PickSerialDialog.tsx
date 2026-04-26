import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLineItem } from '@/hooks/stock-adjustments';
import {
  type AddStockAdjustmentLineItemFormData,
  addStockAdjustmentLineItemSchema,
} from '@/schemas/stock-adjustments';

// Type-or-scan a serial. Backend validates it belongs to the parent quant AND status='AVAILABLE'.
const PickSerialForm = ({
  adjustmentId,
  lineId,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  lineId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<AddStockAdjustmentLineItemFormData>({
    resolver: zodResolver(addStockAdjustmentLineItemSchema),
    defaultValues: { serialNumber: '' },
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
      <TextField
        name="serialNumber"
        label="Serial Number"
        placeholder="Type or scan an AVAILABLE serial"
        autoFocus
      />
      <p className="text-xs text-muted-foreground">The serial must belong to the picked quant and be AVAILABLE.</p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Done
        </Button>
        <Button type="submit">Pick & Add Another</Button>
      </div>
    </Form>
  );
};

export const PickSerialDialog = ({
  adjustmentId,
  lineId,
  handle,
}: {
  adjustmentId: string;
  lineId: string | null;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Pick Serial"
    description="Type or scan a serial to consume it from the picked quant."
    content={(close) =>
      lineId ? (
        <PickSerialForm adjustmentId={adjustmentId} lineId={lineId} onSuccess={close} onCancel={close} />
      ) : null
    }
  />
);
