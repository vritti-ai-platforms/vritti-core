import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useAddGoodsReceiptLot } from '@/hooks/goods-receipts';
import { type AddGoodsReceiptLotFormData, addGoodsReceiptLotSchema } from '@/schemas/goods-receipts';

const AddLotForm = ({
  goodsReceiptId,
  itemId,
  onSuccess,
  onCancel,
}: {
  goodsReceiptId: string;
  itemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<AddGoodsReceiptLotFormData>({
    resolver: zodResolver(addGoodsReceiptLotSchema),
    defaultValues: { lotNumber: '', manufacturingDate: '', expiryDate: '' },
  });
  const mutation = useAddGoodsReceiptLot(goodsReceiptId, itemId, { onSuccess });

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
      <TextField name="lotNumber" label="Lot Number" placeholder="e.g. ABC-2026-001" />
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
  goodsReceiptId,
  itemId,
  handle,
}: {
  goodsReceiptId: string;
  itemId: string;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Add Lot"
    description="Add a new lot for this item. Lines under this lot will share its lot number, manufacturing date, and expiry."
    content={(close) => (
      <AddLotForm goodsReceiptId={goodsReceiptId} itemId={itemId} onSuccess={close} onCancel={close} />
    )}
  />
);
