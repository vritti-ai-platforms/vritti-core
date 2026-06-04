import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { SerialSelector } from '@vritti/quantum-ui/selects/serial';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLineItem } from '@/hooks/stock-adjustments';
import { type AddStockAdjustmentLineItemFormData, addStockAdjustmentLineItemSchema } from '@/schemas/stock-adjustments';

const PickSerialForm = ({
  adjustmentId,
  lineId,
  quantId,
  lineItemsCount,
  quantity,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  lineId: string;
  quantId: string;
  lineItemsCount: number;
  quantity: number;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const isLastSlot = lineItemsCount === quantity - 1;

  const form = useForm<AddStockAdjustmentLineItemFormData>({
    resolver: zodResolver(addStockAdjustmentLineItemSchema),
    defaultValues: { serialNumber: '' },
  });

  const mutation = useAddStockAdjustmentLineItem(adjustmentId, lineId, {
    onSuccess: () => {
      if (isLastSlot) {
        onSuccess();
      } else {
        form.reset({ serialNumber: '' });
      }
    },
  });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ serialNumber: data.serialNumber })}
    >
      <SerialSelector
        name="serialNumber"
        label="Serial Number"
        placeholder="Pick an AVAILABLE serial"
        params={{ quantId }}
        fieldKeys={{ valueKey: 'serialNumber', labelKey: 'serialNumber' }}
      />
      <p className="text-xs text-muted-foreground">The serial must belong to the picked quant and be AVAILABLE.</p>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Done
        </Button>
        <Button type="submit">{isLastSlot ? 'Pick' : 'Pick & Add Another'}</Button>
      </div>
    </Form>
  );
};

export const PickSerialDialog = ({
  adjustmentId,
  lineId,
  quantId,
  lineItemsCount,
  quantity,
  handle,
}: {
  adjustmentId: string;
  lineId: string | null;
  quantId: string | null;
  lineItemsCount: number;
  quantity: number;
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
          lineItemsCount={lineItemsCount}
          quantity={quantity}
          onSuccess={close}
          onCancel={close}
        />
      ) : null
    }
  />
);
