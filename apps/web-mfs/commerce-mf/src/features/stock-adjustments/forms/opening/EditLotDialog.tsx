import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useUpdateStockAdjustmentLot } from '@/hooks/stock-adjustments';
import {
  type AddStockAdjustmentLotFormData,
  addStockAdjustmentLotSchema,
  type StockAdjustmentLotData,
} from '@/schemas/stock-adjustments';

const toDateInput = (value: string | null): string => (value ? value.slice(0, 10) : '');

const EditLotForm = ({
  adjustmentId,
  lot,
  onSuccess,
  onCancel,
}: {
  adjustmentId: string;
  lot: StockAdjustmentLotData;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<AddStockAdjustmentLotFormData>({
    resolver: zodResolver(addStockAdjustmentLotSchema),
    defaultValues: {
      lotNumber: lot.lotNumber,
      manufacturingDate: toDateInput(lot.manufacturingDate),
      expiryDate: toDateInput(lot.expiryDate),
    },
  });

  const manufacturingDate = form.watch('manufacturingDate');
  const expiryDate = form.watch('expiryDate');
  const expiryMinDate = manufacturingDate ? new Date(manufacturingDate) : undefined;
  const mfgMaxDate = expiryDate ? new Date(expiryDate) : undefined;

  const mutation = useUpdateStockAdjustmentLot(adjustmentId, lot.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        lotNumber: data.lotNumber.trim(),
        manufacturingDate: data.manufacturingDate?.trim() || null,
        expiryDate: data.expiryDate.trim(),
      })}
    >
      <TextField name="lotNumber" label="Lot Number" placeholder="e.g. ABC-2024-001" />
      <DatePicker name="manufacturingDate" label="Manufacturing Date" maxDate={mfgMaxDate} />
      <DatePicker name="expiryDate" label="Expiry Date" minDate={expiryMinDate} />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </div>
    </Form>
  );
};

export const EditLotDialog = ({
  adjustmentId,
  lot,
  handle,
}: {
  adjustmentId: string;
  lot: StockAdjustmentLotData | null;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Edit Lot"
    description="Update this lot's number or dates."
    content={(close) =>
      lot ? <EditLotForm adjustmentId={adjustmentId} lot={lot} onSuccess={close} onCancel={close} /> : null
    }
  />
);
