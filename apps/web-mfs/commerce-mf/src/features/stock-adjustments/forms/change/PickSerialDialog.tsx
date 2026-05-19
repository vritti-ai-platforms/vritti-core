import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { QuantItemSelector } from '@vritti/quantum-ui/selects/quant-item';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLineItem } from '@/hooks/stock-adjustments';
import { type AddStockAdjustmentLineItemFormData, addStockAdjustmentLineItemSchema } from '@/schemas/stock-adjustments';

const PickSerialForm = ({
  adjustmentId,
  lineId,
  quantId,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  lineId: string;
  quantId: string;
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
      transformSubmit={(data) => ({ serialNumber: data.serialNumber })}
    >
      <QuantItemSelector
        name="serialNumber"
        label="Serial Number"
        placeholder="Pick an AVAILABLE serial"
        quantId={quantId}
        fieldKeys={{ valueKey: 'serialNumber', labelKey: 'serialNumber' }}
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
  quantId,
  handle,
}: {
  adjustmentId: string;
  lineId: string | null;
  quantId: string | null;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Pick Serial"
    description="Select a serial to consume it from the picked quant."
    content={(close) =>
      lineId && quantId ? (
        <PickSerialForm
          adjustmentId={adjustmentId}
          lineId={lineId}
          quantId={quantId}
          onSuccess={close}
          onCancel={close}
        />
      ) : null
    }
  />
);
