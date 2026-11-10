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
import { type GoodsReceiptLotFormData, goodsReceiptLotSchema } from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../../bindings';

interface AddLotFormProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Adds a batch of the item with its dates and, where the role may set it, its printed MRP in the company's currency
const AddLotForm: React.FC<AddLotFormProps> = ({ binding, goodsReceiptId, itemId, onSuccess, onCancel }) => {
  const canSetMrp = usePermission(binding.mrpEditPermission).available;
  const leCurrencyCode = useWorkspaceCurrency();
  const form = useForm<GoodsReceiptLotFormData>({
    resolver: zodResolver(goodsReceiptLotSchema),
    defaultValues: { lotNumber: '' },
  });
  const mutation = binding.useAddLot(goodsReceiptId, itemId, { onSuccess });

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
        mrp: canSetMrp ? data.mrp : undefined,
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
        <Button type="submit">Add Lot</Button>
      </DialogActions>
    </Form>
  );
};

interface AddLotDialogProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  handle: DialogHandle;
}

// The Add Lot dialog of a lot-tracked item
export const AddLotDialog: React.FC<AddLotDialogProps> = ({ binding, goodsReceiptId, itemId, handle }) => (
  <Dialog
    handle={handle}
    icon={PackageCheck}
    title="Add Lot"
    description="Add a new lot for this item. Lines under this lot share its lot number, dates and MRP."
    content={(close) => (
      <AddLotForm
        binding={binding}
        goodsReceiptId={goodsReceiptId}
        itemId={itemId}
        onSuccess={close}
        onCancel={close}
      />
    )}
  />
);
