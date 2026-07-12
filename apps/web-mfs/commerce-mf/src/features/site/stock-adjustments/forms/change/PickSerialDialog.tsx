import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { SerialSelector } from '@vritti/quantum-ui/selects/serial';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { ClipboardMinus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { type AddStockAdjustmentLineItemFormData, addStockAdjustmentLineItemSchema } from '@/schemas/stock-adjustments';
import { useAddStockAdjustmentLineItem } from '@/hooks/site/stock-adjustments';

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
      <DialogActions>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Done
        </Button>
        <Button type="submit">{isLastSlot ? 'Pick' : 'Pick & Add Another'}</Button>
      </DialogActions>
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
    icon={ClipboardMinus}
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
