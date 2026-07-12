import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useBUCurrency, useDialog } from '@vritti/quantum-ui/hooks';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { PackageCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import {
  buildUpdateGoodsReceiptItemSchema,
  type GoodsReceiptItemData,
  type UpdateGoodsReceiptItemFormData,
} from '@/schemas/goods-receipts';
import { useUpdateGoodsReceiptItem } from '@/hooks/site/goods-receipts';
import { computeFreeQty } from '@/utils/freeQty';

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
  // PO remaining (ordered − received) caps the ordered qty for PO-linked items; null (un-linked) → uncapped.
  const maxQuantity = item.poRemainingQuantity ?? undefined;
  const form = useForm<UpdateGoodsReceiptItemFormData>({
    resolver: zodResolver(
      buildUpdateGoodsReceiptItemSchema({ allowDecimal: item.inventoryItemAllowDecimal, max: maxQuantity }),
    ),
    defaultValues: {
      orderedQty: item.orderedQty,
      rejectedQuantity: item.rejectedQuantity,
      unitPrice: item.unitPrice ?? undefined,
      schemeBuyQty: item.schemeBuyQty ?? undefined,
      schemeFreeQty: item.schemeFreeQty ?? undefined,
      hasScheme: item.hasScheme ?? false,
    },
  });
  const mutation = useUpdateGoodsReceiptItem(goodsReceiptId, item.id, { onSuccess });
  const lockedCurrency = item.unitPrice?.currency ?? buCurrencyCode;

  const hasScheme = form.watch('hasScheme');
  const freeQtyPreview = computeFreeQty(
    form.watch('orderedQty'),
    form.watch('schemeBuyQty'),
    form.watch('schemeFreeQty'),
    hasScheme,
  );

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        orderedQty: data.orderedQty,
        rejectedQuantity: data.rejectedQuantity ?? 0,
        unitPrice: data.unitPrice?.value ? data.unitPrice : undefined,
        schemeBuyQty: data.schemeBuyQty,
        schemeFreeQty: data.schemeFreeQty,
        hasScheme: data.hasScheme,
      })}
    >
      <TextField
        name="orderedQty"
        label="Ordered Qty"
        type="number"
        integer={!item.inventoryItemAllowDecimal}
        positive
        max={maxQuantity}
      />
      <CurrencyField
        name="unitPrice"
        label="Supplier Unit Price"
        currencyCode={lockedCurrency}
        description="Update to reflect the actual supplier invoice price. Recalculates the landed cost at next publish."
      />
      <TextField name="rejectedQuantity" label="Damaged on arrival" type="number" />

      {hasScheme && <FreeQtyPreview value={freeQtyPreview} />}

      <FormSection title="Free Goods Scheme">
        <div className="flex flex-col gap-4">
          <Switch name="hasScheme" label="Free goods scheme" description="Supplier ships bonus units on this item." />
          {hasScheme && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="schemeBuyQty" label="Buy Qty" type="number" integer positive />
              <TextField name="schemeFreeQty" label="Free Qty" type="number" integer positive />
            </div>
          )}
        </div>
      </FormSection>

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
    icon={PackageCheck}
    title="Edit Item"
    description="Update the supplier unit price or the damage-on-arrival quantity for this item."
    content={(close) =>
      item ? <EditItemForm goodsReceiptId={goodsReceiptId} item={item} onSuccess={close} onCancel={close} /> : null
    }
  />
);
