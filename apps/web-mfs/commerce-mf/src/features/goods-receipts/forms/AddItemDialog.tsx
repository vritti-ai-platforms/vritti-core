import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency, useDialog } from '@vritti/quantum-ui/hooks';
import { minorToMajor } from '@vritti/quantum-ui/money';
import type { SelectOption } from '@vritti/quantum-ui/Select';
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

interface ResolvedPrefill {
  unitPrice: { currency: string; value: string };
  source: 'PO' | 'SUPPLIER_ITEM';
}

// Reads `option.additionals` to resolve the supplier unit price. PO line price wins when present
// (the SupplierItemSelector projects it via a LEFT JOIN when purchaseOrderId is passed); otherwise
// falls back to the supplier-catalog price. Returns null when neither is available.
function resolvePrefillFromOption(option: SelectOption | null): ResolvedPrefill | null {
  if (!option?.additionals) return null;
  const a = option.additionals;
  const poUnitPrice = typeof a.poUnitPrice === 'number' ? a.poUnitPrice : null;
  const poCurrency = typeof a.poCurrencyCode === 'string' ? a.poCurrencyCode : null;
  if (poUnitPrice != null && poUnitPrice > 0 && poCurrency) {
    return {
      unitPrice: { currency: poCurrency, value: minorToMajor(String(poUnitPrice), poCurrency) },
      source: 'PO',
    };
  }
  const supplierUnitPrice = typeof a.unitPrice === 'number' ? a.unitPrice : null;
  const supplierCurrency = typeof a.currencyCode === 'string' ? a.currencyCode : null;
  if (supplierUnitPrice != null && supplierUnitPrice > 0 && supplierCurrency) {
    return {
      unitPrice: { currency: supplierCurrency, value: minorToMajor(String(supplierUnitPrice), supplierCurrency) },
      source: 'SUPPLIER_ITEM',
    };
  }
  return null;
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
  const [prefillSource, setPrefillSource] = useState<'PO' | 'SUPPLIER_ITEM' | null>(null);
  const [pickedSupplierItem, setPickedSupplierItem] = useState<boolean>(false);

  const handleItemSelect = (option: SelectOption | null) => {
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    setPickedSupplierItem(!!option);
    const prefill = resolvePrefillFromOption(option);
    if (prefill) {
      form.setValue('unitPrice', prefill.unitPrice, { shouldDirty: false });
      setPrefillSource(prefill.source);
    } else {
      form.setValue('unitPrice', undefined, { shouldDirty: false });
      setPrefillSource(null);
    }
  };

  const prefillNote =
    prefillSource === 'PO'
      ? 'Pre-filled from the linked purchase order — edit if the supplier delivered at a different price.'
      : prefillSource === 'SUPPLIER_ITEM'
        ? 'Pre-filled from the supplier catalog — edit if needed.'
        : pickedSupplierItem
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
