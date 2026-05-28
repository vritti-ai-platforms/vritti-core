import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency, useDialog } from '@vritti/quantum-ui/hooks';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { SupplierItemSelector } from '@vritti/quantum-ui/selects/supplier-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddGoodsReceiptItem, useGoodsReceiptItemPricePrefill } from '@/hooks/goods-receipts';
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
    defaultValues: { supplierItemId: '', rejectedQuantity: undefined, unitPrice: undefined },
  });
  const mutation = useAddGoodsReceiptItem(goodsReceiptId, { onSuccess });
  // The picked supplier item's UOM dictates whether the rejected qty input allows decimals (e.g.
  // a "case" UOM is whole-number-only, a "kg" UOM allows fractions).
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);
  const [pricePrefillKeys, setPricePrefillKeys] = useState<{ inventoryItemId: string; uomId: string } | null>(null);
  const prefillQuery = useGoodsReceiptItemPricePrefill(
    goodsReceiptId,
    pricePrefillKeys?.inventoryItemId ?? null,
    pricePrefillKeys?.uomId ?? null,
  );

  // When the prefill query lands, populate the CurrencyField if it's empty so the user can
  // accept-or-edit the pre-fill. Don't overwrite a value the user has already typed.
  useEffect(() => {
    if (!prefillQuery.data?.unitPrice) return;
    const current = form.getValues('unitPrice');
    if (!current || !current.value) {
      form.setValue('unitPrice', prefillQuery.data.unitPrice, { shouldDirty: false });
    }
  }, [prefillQuery.data, form]);

  const handleItemSelect = (option: SelectOption | null) => {
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    const inventoryItemId =
      typeof option?.additionals?.inventoryItemId === 'string' ? option.additionals.inventoryItemId : null;
    const uomId = typeof option?.additionals?.uomId === 'string' ? option.additionals.uomId : null;
    if (inventoryItemId && uomId) {
      setPricePrefillKeys({ inventoryItemId, uomId });
    } else {
      setPricePrefillKeys(null);
    }
    // Reset the unit price so the prefill effect populates the new selection's price.
    form.setValue('unitPrice', undefined, { shouldDirty: false });
  };

  const prefillSource = prefillQuery.data?.source;
  const prefillNote =
    prefillSource === 'PO'
      ? 'Pre-filled from the linked purchase order — edit if the supplier delivered at a different price.'
      : prefillSource === 'SUPPLIER_ITEM'
        ? 'Pre-filled from the supplier catalog — edit if needed.'
        : pricePrefillKeys
          ? 'No pre-fill available. Enter the supplier price so it auto-creates a SUPPLIER_PRICE cost row at publish.'
          : undefined;

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierItemId: data.supplierItemId,
        rejectedQuantity: data.rejectedQuantity,
        unitPrice: data.unitPrice && data.unitPrice.value ? data.unitPrice : undefined,
      })}
    >
      <SupplierItemSelector
        name="supplierItemId"
        params={{
          supplierId,
          ...(poId ? { purchaseOrderId: poId } : {}),
          excludeOnGoodsReceiptId: goodsReceiptId,
        }}
        onOptionSelect={handleItemSelect}
      />
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
        ? 'Pick a supplier item from the linked purchase order. The price pre-fills from the PO.'
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
