import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency, useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useUpdateGoodsReceiptItem } from '@/hooks/goods-receipts';
import {
  buildUpdateGoodsReceiptItemSchema,
  type GoodsReceiptItemData,
  type UpdateGoodsReceiptItemFormData,
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
  const buCurrencyCode = useBUCurrency() ?? 'INR';
  // PO remaining (ordered − received) caps the quantity for PO-linked items; for a draft it excludes
  // this receipt, so it's the correct editable ceiling. Null (un-linked) → uncapped.
  const maxQuantity = item.poRemainingQuantity ?? undefined;
  // Can't drop below what's already distributed across lots/lines.
  const minQuantity = item.acceptedQuantity > 0 ? item.acceptedQuantity : undefined;
  const form = useForm<UpdateGoodsReceiptItemFormData>({
    resolver: zodResolver(
      buildUpdateGoodsReceiptItemSchema({ allowDecimal: item.inventoryItemAllowDecimal, min: minQuantity, max: maxQuantity }),
    ),
    defaultValues: {
      quantity: item.quantity,
      rejectedQuantity: item.rejectedQuantity,
      unitPrice: item.unitPrice ?? undefined,
    },
  });
  const mutation = useUpdateGoodsReceiptItem(goodsReceiptId, item.id, { onSuccess });
  const lockedCurrency = item.unitPrice?.currency ?? buCurrencyCode;

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        quantity: data.quantity,
        rejectedQuantity: data.rejectedQuantity ?? 0,
        unitPrice: data.unitPrice && data.unitPrice.value ? data.unitPrice : undefined,
      })}
    >
      <TextField
        name="quantity"
        label="Quantity"
        type="number"
        integer={!item.inventoryItemAllowDecimal}
        positive
        min={minQuantity}
        max={maxQuantity}
      />
      <CurrencyField
        name="unitPrice"
        label="Supplier Unit Price"
        currencyCode={lockedCurrency}
        description="Update to reflect the actual supplier invoice price. Recalculates the auto-cost at next publish."
      />
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
    description="Update the supplier unit price or the damage-on-arrival quantity for this item."
    content={(close) =>
      item ? <EditItemForm goodsReceiptId={goodsReceiptId} item={item} onSuccess={close} onCancel={close} /> : null
    }
  />
);
