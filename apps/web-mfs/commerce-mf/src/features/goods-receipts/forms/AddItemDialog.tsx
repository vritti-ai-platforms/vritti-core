import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency, useDialog } from '@vritti/quantum-ui/hooks';
import { minorToMajor } from '@vritti/quantum-ui/money';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { PurchaseOrderItemSelector } from '@vritti/quantum-ui/selects/purchase-order-item';
import { SupplierItemSelector } from '@vritti/quantum-ui/selects/supplier-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddGoodsReceiptItem } from '@/hooks/goods-receipts';
import { type AddGoodsReceiptItemFormData, addGoodsReceiptItemSchema } from '@/schemas/goods-receipts';

interface AddItemDialogContext {
  goodsReceiptId: string;
  supplierId: string;
  poId?: string | null;
}

const AddItemForm = ({
  goodsReceiptId,
  supplierId,
  poId,
  onSuccess,
  onCancel,
}: AddItemDialogContext & { onSuccess: () => void; onCancel: () => void }) => {
  const buCurrencyCode = useBUCurrency() ?? 'INR';
  const form = useForm<AddGoodsReceiptItemFormData>({
    resolver: zodResolver(addGoodsReceiptItemSchema),
    defaultValues: {
      pickerSelection: '',
      inventoryItemId: '',
      uomId: '',
      rejectedQuantity: undefined,
      unitPrice: undefined,
    },
  });
  const mutation = useAddGoodsReceiptItem(goodsReceiptId, { onSuccess });
  // The picked option's UOM dictates whether the rejected qty input allows decimals (e.g.
  // a "case" UOM is whole-number-only, a "kg" UOM allows fractions).
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);
  const [hasPrefill, setHasPrefill] = useState<boolean>(false);
  const [pickedItem, setPickedItem] = useState<boolean>(false);

  const handleItemSelect = (option: SelectOption | null) => {
    const a = option?.additionals;
    setAllowDecimal(a?.allowDecimal === true);
    setPickedItem(!!option);

    const inventoryItemId = typeof a?.inventoryItemId === 'string' ? a.inventoryItemId : '';
    const uomId = typeof a?.uomId === 'string' ? a.uomId : '';
    form.setValue('inventoryItemId', inventoryItemId, { shouldValidate: true });
    form.setValue('uomId', uomId, { shouldValidate: true });

    const rawPrice = typeof a?.unitPrice === 'number' ? a.unitPrice : null;
    const currencyCode = typeof a?.currencyCode === 'string' ? a.currencyCode : null;
    if (rawPrice != null && rawPrice > 0 && currencyCode) {
      form.setValue(
        'unitPrice',
        { currency: currencyCode, value: minorToMajor(String(rawPrice), currencyCode) },
        { shouldDirty: false },
      );
      setHasPrefill(true);
    } else {
      form.setValue('unitPrice', undefined, { shouldDirty: false });
      setHasPrefill(false);
    }
  };

  const prefillNote = hasPrefill
    ? poId
      ? 'Pre-filled from the linked purchase order — edit if the supplier delivered at a different price.'
      : 'Pre-filled from the supplier catalog — edit if needed.'
    : pickedItem
      ? 'No pre-fill available. Enter the supplier price so it auto-creates a SUPPLIER_PRICE cost row at publish.'
      : undefined;

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        uomId: data.uomId,
        rejectedQuantity: data.rejectedQuantity,
        unitPrice: data.unitPrice && data.unitPrice.value ? data.unitPrice : undefined,
      })}
    >
      {poId ? (
        <PurchaseOrderItemSelector
          name="pickerSelection"
          label="Purchase Order Item"
          params={{ purchaseOrderId: poId, excludeOnGoodsReceiptId: goodsReceiptId }}
          onOptionSelect={handleItemSelect}
        />
      ) : (
        <SupplierItemSelector
          name="pickerSelection"
          params={{ supplierId, excludeOnGoodsReceiptId: goodsReceiptId }}
          onOptionSelect={handleItemSelect}
        />
      )}
      <CurrencyField
        name="unitPrice"
        label="Supplier Unit Price"
        currencyCode={buCurrencyCode}
        description={prefillNote}
      />
      <TextField
        name="rejectedQuantity"
        label="Damaged on Arrival"
        description="Optional. Quantity received but unusable — recorded for audit, not added to inventory."
        type="number"
        integer={!allowDecimal}
        positive
      />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Item</Button>
      </div>
    </Form>
  );
};

export const AddItemDialog = ({
  goodsReceiptId,
  supplierId,
  poId,
  handle,
}: AddItemDialogContext & { handle: ReturnType<typeof useDialog> }) => (
  <Dialog
    handle={handle}
    title="Add Item"
    description={
      poId
        ? 'Pick a line from the linked purchase order. The price pre-fills from the PO.'
        : 'Pick a supplier item to receive on this goods receipt. The price pre-fills from the supplier catalog.'
    }
    content={(close) => (
      <AddItemForm
        goodsReceiptId={goodsReceiptId}
        supplierId={supplierId}
        poId={poId}
        onSuccess={close}
        onCancel={close}
      />
    )}
  />
);
