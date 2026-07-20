import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { ClipboardMinus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { type AddStockAdjustmentLotFormData, addStockAdjustmentLotSchema } from '@/schemas/stock-adjustments';
import { useAddStockAdjustmentLot } from '@/hooks/site/stock-adjustments';

const AddLotForm = ({
  adjustmentId,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<AddStockAdjustmentLotFormData>({
    resolver: zodResolver(addStockAdjustmentLotSchema),
    defaultValues: { lotNumber: '', manufacturingDate: '', expiryDate: '' },
  });

  const manufacturingDate = form.watch('manufacturingDate');
  const expiryDate = form.watch('expiryDate');
  const expiryMinDate = manufacturingDate ? new Date(manufacturingDate) : undefined;
  const mfgMaxDate = expiryDate ? new Date(expiryDate) : undefined;

  const mutation = useAddStockAdjustmentLot(adjustmentId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        lotNumber: data.lotNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
      })}
    >
      <TextField name="lotNumber" label="Lot Number" placeholder="e.g. ABC-2024-001" />
      <DatePicker name="manufacturingDate" label="Manufacturing Date" maxDate={mfgMaxDate} />
      <DatePicker name="expiryDate" label="Expiry Date" minDate={expiryMinDate} />

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Lot</Button>
      </DialogActions>
    </Form>
  );
};

export const AddLotDialog = ({
  adjustmentId,
  handle,
}: {
  adjustmentId: string;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    icon={ClipboardMinus}
    title="Add Lot"
    description="Add a new lot to this adjustment. Lines under this lot will share its lot number, manufacturing date, and expiry."
    content={(close) => <AddLotForm adjustmentId={adjustmentId} onSuccess={close} onCancel={close} />}
  />
);
