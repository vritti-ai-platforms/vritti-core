import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLot } from '@/hooks/stock-adjustments';
import {
  type AddStockAdjustmentLotFormData,
  addStockAdjustmentLotSchema,
} from '@/schemas/stock-adjustments';

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

  const mutation = useAddStockAdjustmentLot(adjustmentId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        lotNumber: data.lotNumber.trim(),
        manufacturingDate: data.manufacturingDate?.trim() || undefined,
        expiryDate: data.expiryDate.trim(),
      })}
    >
      <TextField name="lotNumber" label="Lot Number" placeholder="e.g. ABC-2024-001" />
      <DatePicker name="manufacturingDate" label="Manufacturing Date" />
      <DatePicker name="expiryDate" label="Expiry Date" />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Lot</Button>
      </div>
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
    title="Add Lot"
    description="Add a new lot to this adjustment. Lines under this lot will share its lot number, manufacturing date, and expiry."
    content={(close) => <AddLotForm adjustmentId={adjustmentId} onSuccess={close} onCancel={close} />}
  />
);
