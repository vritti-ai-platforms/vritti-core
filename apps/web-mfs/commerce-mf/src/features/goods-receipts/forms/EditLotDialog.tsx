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
import { useUpdateGoodsReceiptLot } from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptLotFormData,
  addGoodsReceiptLotSchema,
  type GoodsReceiptLotData,
} from '@/schemas/goods-receipts';

const toDateInput = (value: string | null): string => (value ? value.slice(0, 10) : '');

const EditLotForm = ({
  goodsReceiptId,
  itemId,
  lot,
  hasMrp,
  onSuccess,
  onCancel,
}: {
  goodsReceiptId: string;
  itemId: string;
  lot: GoodsReceiptLotData;
  hasMrp: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<AddGoodsReceiptLotFormData>({
    resolver: zodResolver(addGoodsReceiptLotSchema),
    defaultValues: {
      lotNumber: lot.lotNumber,
      manufacturingDate: toDateInput(lot.manufacturingDate),
      expiryDate: toDateInput(lot.expiryDate),
      mrp: lot.mrp ?? undefined,
    },
  });
  const mutation = useUpdateGoodsReceiptLot(goodsReceiptId, itemId, lot.id, { onSuccess });
  const buCurrencyCode = useBUCurrency();

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        lotNumber: data.lotNumber.trim(),
        manufacturingDate: data.manufacturingDate?.trim() || null,
        expiryDate: data.expiryDate.trim(),
        mrp: data.mrp?.value ? data.mrp : null,
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
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </DialogActions>
    </Form>
  );
};

export const EditLotDialog = ({
  goodsReceiptId,
  itemId,
  lot,
  hasMrp,
  handle,
}: {
  goodsReceiptId: string;
  itemId: string;
  lot: GoodsReceiptLotData | null;
  hasMrp: boolean;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    icon={PackageCheck}
    title="Edit Lot"
    description="Update this lot's number or dates."
    content={(close) =>
      lot ? (
        <EditLotForm
          goodsReceiptId={goodsReceiptId}
          itemId={itemId}
          lot={lot}
          hasMrp={hasMrp}
          onSuccess={close}
          onCancel={close}
        />
      ) : null
    }
  />
);
