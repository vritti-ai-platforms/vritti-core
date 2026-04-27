import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useUpdateGoodsReceiptItem } from '@/hooks/goods-receipts';
import {
  type GoodsReceiptItemData,
  type UpdateGoodsReceiptItemFormData,
  updateGoodsReceiptItemSchema,
} from '@/schemas/goods-receipts';

const EditItemForm = ({
  goodsReceiptId,
  item,
  onSuccess,
  onCancel,
}: {
  goodsReceiptId: string;
  item: GoodsReceiptItemData;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<UpdateGoodsReceiptItemFormData>({
    resolver: zodResolver(updateGoodsReceiptItemSchema),
    defaultValues: { rejectedQuantity: String(item.rejectedQuantity) },
  });
  const mutation = useUpdateGoodsReceiptItem(goodsReceiptId, item.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        rejectedQuantity: data.rejectedQuantity ? Number(data.rejectedQuantity) : 0,
      })}
    >
      <TextField name="rejectedQuantity" label="Damaged on arrival" type="number" />

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

export const EditItemDialog = ({
  goodsReceiptId,
  item,
  handle,
}: {
  goodsReceiptId: string;
  item: GoodsReceiptItemData | null;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Edit Item"
    description="Update the damage-on-arrival quantity for this item."
    content={(close) =>
      item ? <EditItemForm goodsReceiptId={goodsReceiptId} item={item} onSuccess={close} onCancel={close} /> : null
    }
  />
);
