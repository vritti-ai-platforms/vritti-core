import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { PackageCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { type AddGoodsReceiptLineItemFormData, addGoodsReceiptLineItemSchema } from '@/schemas/goods-receipts';
import { useAddGoodsReceiptLineItem } from '@/site/hooks/goods-receipts';

const AddSerialForm = ({
  goodsReceiptId,
  itemId,
  lineId,
  suggestedSerial,
  onSuccess,
  onCancel,
}: {
  goodsReceiptId: string;
  itemId: string;
  lineId: string;
  suggestedSerial?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<AddGoodsReceiptLineItemFormData>({
    resolver: zodResolver(addGoodsReceiptLineItemSchema),
    defaultValues: { serialNumber: suggestedSerial ?? '' },
  });

  const mutation = useAddGoodsReceiptLineItem(goodsReceiptId, itemId, lineId, {
    onSuccess: () => {
      form.reset({ serialNumber: '' });
    },
  });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ serialNumber: data.serialNumber.trim() })}
    >
      <TextField name="serialNumber" label="Serial Number" placeholder="e.g. BOT-001" autoFocus />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Done
        </Button>
        <Button type="submit">Save &amp; Add Another</Button>
      </DialogActions>
    </Form>
  );
};

// Suggest the next serial based on the last one (trailing digits incremented).
export const suggestNextSerial = (last: string | undefined): string | undefined => {
  if (!last) return undefined;
  const match = last.match(/^(.*?)(\d+)$/);
  if (!match) return undefined;
  const [, prefix, digits] = match;
  const next = (Number(digits) + 1).toString().padStart(digits.length, '0');
  return `${prefix}${next}`;
};

export const AddSerialDialog = ({
  goodsReceiptId,
  itemId,
  lineId,
  lastSerial,
  handle,
}: {
  goodsReceiptId: string;
  itemId: string;
  lineId: string | null;
  lastSerial?: string;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    icon={PackageCheck}
    title="Add Serial"
    description="Type the serial. The form auto-resets so you can add several in a row."
    content={(close) =>
      lineId ? (
        <AddSerialForm
          goodsReceiptId={goodsReceiptId}
          itemId={itemId}
          lineId={lineId}
          suggestedSerial={suggestNextSerial(lastSerial)}
          onSuccess={close}
          onCancel={close}
        />
      ) : null
    }
  />
);
