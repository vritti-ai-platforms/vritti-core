import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import type { DialogHandle } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { PackageCheck } from 'lucide-react';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type AddGoodsReceiptLineItemFormData, addGoodsReceiptLineItemSchema } from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../../bindings';

interface AddSerialFormProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  lineId: string;
  suggestedSerial: string | undefined;
  onDone: () => void;
}

// Suggests the serial after the last one by incrementing its trailing digits
function suggestNextSerial(last: string | undefined): string | undefined {
  const match = last?.match(/^(.*?)(\d+)$/);
  if (!match) return undefined;
  const [, prefix, digits] = match;
  return `${prefix}${(Number(digits) + 1).toString().padStart(digits.length, '0')}`;
}

// Adds serials one after another; the form clears after each so the next can be typed straight away
const AddSerialForm: React.FC<AddSerialFormProps> = ({
  binding,
  goodsReceiptId,
  itemId,
  lineId,
  suggestedSerial,
  onDone,
}) => {
  const form = useForm<AddGoodsReceiptLineItemFormData>({
    resolver: zodResolver(addGoodsReceiptLineItemSchema),
    defaultValues: { serialNumber: suggestedSerial ?? '' },
  });
  const mutation = binding.useAddLineItem(goodsReceiptId, itemId, lineId, {
    onSuccess: () => form.reset({ serialNumber: '' }),
  });

  return (
    <Form form={form} mutation={mutation} onCancel={onDone}>
      <TextField name="serialNumber" label="Serial Number" placeholder="e.g. BOT-001" autoFocus />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onDone}>
          Done
        </Button>
        <Button type="submit">Save &amp; Add Another</Button>
      </DialogActions>
    </Form>
  );
};

interface AddSerialDialogProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  lineId: string;
  lastSerial: string | undefined;
  handle: DialogHandle;
}

// The Add Serial dialog of a serial-tracked line
export const AddSerialDialog: React.FC<AddSerialDialogProps> = ({
  binding,
  goodsReceiptId,
  itemId,
  lineId,
  lastSerial,
  handle,
}) => (
  <Dialog
    handle={handle}
    icon={PackageCheck}
    title="Add Serial"
    description="Type the serial. The form clears after each one so you can add several in a row."
    content={(close) => (
      <AddSerialForm
        binding={binding}
        goodsReceiptId={goodsReceiptId}
        itemId={itemId}
        lineId={lineId}
        suggestedSerial={suggestNextSerial(lastSerial)}
        onDone={close}
      />
    )}
  />
);
