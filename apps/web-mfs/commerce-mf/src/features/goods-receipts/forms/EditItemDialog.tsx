import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useBUCurrency, useDialog } from '@vritti/quantum-ui/hooks';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useUpdateGoodsReceiptItem } from '@/hooks/goods-receipts';
import {
  buildUpdateGoodsReceiptItemSchema,
  type FreeSchemeMode,
  freeSchemeModeLabels,
  type GoodsReceiptItemData,
  type UpdateGoodsReceiptItemFormData,
} from '@/schemas/goods-receipts';

const schemeModeOptions = (Object.keys(freeSchemeModeLabels) as FreeSchemeMode[]).map((mode) => ({
  value: mode,
  label: freeSchemeModeLabels[mode],
}));

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
  // PO remaining (ordered − received) caps the ordered (paid) qty for PO-linked items; for a draft it
  // excludes this receipt, so it's the correct editable ceiling. Null (un-linked) → uncapped.
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
      schemeMode: item.schemeMode ?? 'none',
    },
  });
  const mutation = useUpdateGoodsReceiptItem(goodsReceiptId, item.id, { onSuccess });
  const lockedCurrency = item.unitPrice?.currency ?? buCurrencyCode;

  const schemeMode = form.watch('schemeMode');

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
        schemeMode: data.schemeMode,
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

      <FormSection title="Free Goods Scheme">
        <div className="flex flex-col gap-4">
          <RadioGroup name="schemeMode" label="Scheme" options={schemeModeOptions} orientation="horizontal" />
          {schemeMode !== 'none' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="schemeBuyQty" label="Buy Qty" type="number" positive />
              <TextField name="schemeFreeQty" label="Free Qty" type="number" positive />
            </div>
          )}
        </div>
      </FormSection>

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
