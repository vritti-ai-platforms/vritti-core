import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency, useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { PackageCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAddGoodsReceiptLot } from '@/hooks/goods-receipts';
import { type AddGoodsReceiptLotFormData, addGoodsReceiptLotSchema } from '@/schemas/goods-receipts';

const AddLotForm = ({
  goodsReceiptId,
  itemId,
  hasMrp,
  onSuccess,
  onCancel,
}: {
  goodsReceiptId: string;
  itemId: string;
  hasMrp: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<AddGoodsReceiptLotFormData>({
    resolver: zodResolver(addGoodsReceiptLotSchema),
    defaultValues: { lotNumber: '', manufacturingDate: '', expiryDate: '', mrp: undefined },
  });
  const mutation = useAddGoodsReceiptLot(goodsReceiptId, itemId, { onSuccess });
  const buCurrencyCode = useBUCurrency();

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
        mrp: data.mrp?.value ? data.mrp : undefined,
      })}
    >
      <TextField name="lotNumber" label="Lot Number" placeholder="e.g. ABC-2026-001" />
      <DatePicker name="manufacturingDate" label="Manufacturing Date" />
      <DatePicker name="expiryDate" label="Expiry Date" />
      {hasMrp && (
        <CurrencyField
          name="mrp"
          label="MRP"
          description="Printed MRP per primary unit for this batch"
          currencyCode={buCurrencyCode ?? undefined}
        />
      )}

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
  goodsReceiptId,
  itemId,
  hasMrp,
  handle,
}: {
  goodsReceiptId: string;
  itemId: string;
  hasMrp: boolean;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    icon={PackageCheck}
    title="Add Lot"
    description="Add a new lot for this item. Lines under this lot will share its lot number, manufacturing date, and expiry."
    content={(close) => (
      <AddLotForm goodsReceiptId={goodsReceiptId} itemId={itemId} hasMrp={hasMrp} onSuccess={close} onCancel={close} />
    )}
  />
);
