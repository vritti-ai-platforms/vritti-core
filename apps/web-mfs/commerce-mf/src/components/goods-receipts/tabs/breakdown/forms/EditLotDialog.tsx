import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { type DialogHandle, useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { PackageCheck } from 'lucide-react';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type GoodsReceiptLotData,
  type GoodsReceiptLotFormData,
  goodsReceiptLotSchema,
} from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../../bindings';

// The calendar date of a stored lot timestamp, as the date picker takes it
function toDateInput(value: string): string {
  return value.slice(0, 10);
}

interface EditLotFormProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  lot: GoodsReceiptLotData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Updates a batch's number, dates and, where the role may set it, its MRP; clearing the MRP removes it
const EditLotForm: React.FC<EditLotFormProps> = ({ binding, goodsReceiptId, itemId, lot, onSuccess, onCancel }) => {
  const canSetMrp = usePermission(binding.mrpEditPermission).available;
  const leCurrencyCode = useWorkspaceCurrency();
  const form = useForm<GoodsReceiptLotFormData>({
    resolver: zodResolver(goodsReceiptLotSchema),
    defaultValues: {
      lotNumber: lot.lotNumber,
      manufacturingDate: lot.manufacturingDate && toDateInput(lot.manufacturingDate),
      expiryDate: toDateInput(lot.expiryDate),
      mrp: lot.mrp ?? undefined,
    },
  });
  const mutation = binding.useUpdateLot(goodsReceiptId, itemId, lot.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        lotNumber: data.lotNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
        mrp: canSetMrp ? (data.mrp ?? null) : undefined,
      })}
    >
      <TextField name="lotNumber" label="Lot Number" placeholder="e.g. ABC-2026-001" />
      <DatePicker name="manufacturingDate" label="Manufacturing Date" />
      <DatePicker name="expiryDate" label="Expiry Date" />
      <CurrencyField
        name="mrp"
        permission={binding.mrpEditPermission}
        label="MRP"
        description="Printed MRP per primary unit for this batch"
        currencyCode={leCurrencyCode}
      />
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

interface EditLotDialogProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  lot: GoodsReceiptLotData;
  handle: DialogHandle;
}

// The Edit Lot dialog of a lot on a draft receipt
export const EditLotDialog: React.FC<EditLotDialogProps> = ({ binding, goodsReceiptId, itemId, lot, handle }) => (
  <Dialog
    handle={handle}
    icon={PackageCheck}
    title="Edit Lot"
    description={`Update lot ${lot.lotNumber}'s number, dates or MRP.`}
    content={(close) => (
      <EditLotForm
        binding={binding}
        goodsReceiptId={goodsReceiptId}
        itemId={itemId}
        lot={lot}
        onSuccess={close}
        onCancel={close}
      />
    )}
  />
);
