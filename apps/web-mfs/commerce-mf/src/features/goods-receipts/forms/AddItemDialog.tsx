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
import {
  useAddGoodsReceiptItemFromPurchaseOrderItem,
  useAddGoodsReceiptItemFromSupplierItem,
} from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptItemFromPurchaseOrderItemFormData,
  type AddGoodsReceiptItemFromSupplierItemFormData,
  addGoodsReceiptItemFromPurchaseOrderItemSchema,
  addGoodsReceiptItemFromSupplierItemSchema,
} from '@/schemas/goods-receipts';

interface AddItemDialogContext {
  goodsReceiptId: string;
  supplierId: string;
  poId?: string | null;
}

// Two flows, kept side-by-side instead of a single mega-form, because the picker name, mutation
// hook, and zod schema all differ between them. Sharing only the visual chrome (price + rejected
// qty + buttons) is cheaper than collapsing the divergent identity into one schema.

const SupplierItemForm = ({
  goodsReceiptId,
  supplierId,
  onSuccess,
  onCancel,
}: Pick<AddItemDialogContext, 'goodsReceiptId' | 'supplierId'> & { onSuccess: () => void; onCancel: () => void }) => {
  const buCurrencyCode = useBUCurrency() ?? 'INR';
  const form = useForm<AddGoodsReceiptItemFromSupplierItemFormData>({
    resolver: zodResolver(addGoodsReceiptItemFromSupplierItemSchema),
    defaultValues: { supplierItemId: '', rejectedQuantity: undefined, unitPrice: undefined },
  });
  const mutation = useAddGoodsReceiptItemFromSupplierItem(goodsReceiptId, { onSuccess });
  // `allowDecimal` drives the rejected-qty input — can't be derived from form state since it's a
  // UOM property of the picked supplier_items row.
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);

  const handleSelect = (option: SelectOption | null) => {
    const a = option?.additionals;
    setAllowDecimal(a?.allowDecimal === true);

    const rawPrice = typeof a?.unitPrice === 'string' ? a.unitPrice : null;
    const currencyCode = typeof a?.currencyCode === 'string' ? a.currencyCode : null;
    if (rawPrice != null && currencyCode) {
      form.setValue(
        'unitPrice',
        { currency: currencyCode, value: minorToMajor(rawPrice, currencyCode) },
        { shouldDirty: false },
      );
    } else {
      form.setValue('unitPrice', undefined, { shouldDirty: false });
    }
  };

  const supplierItemId = form.watch('supplierItemId');
  const prefillNote = supplierItemId
    ? 'Pre-filled from the supplier catalog — edit if the supplier delivered at a different price.'
    : undefined;

  return (
    <Form form={form} mutation={mutation} onCancel={onCancel}>
      <SupplierItemSelector
        name="supplierItemId"
        params={{ supplierId, excludeOnGoodsReceiptId: goodsReceiptId }}
        onOptionSelect={handleSelect}
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

const PurchaseOrderItemForm = ({
  goodsReceiptId,
  poId,
  onSuccess,
  onCancel,
}: { goodsReceiptId: string; poId: string; onSuccess: () => void; onCancel: () => void }) => {
  const buCurrencyCode = useBUCurrency() ?? 'INR';
  const form = useForm<AddGoodsReceiptItemFromPurchaseOrderItemFormData>({
    resolver: zodResolver(addGoodsReceiptItemFromPurchaseOrderItemSchema),
    defaultValues: { purchaseOrderItemId: '', rejectedQuantity: undefined, unitPrice: undefined },
  });
  const mutation = useAddGoodsReceiptItemFromPurchaseOrderItem(goodsReceiptId, { onSuccess });
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);

  const handleSelect = (option: SelectOption | null) => {
    const a = option?.additionals;
    setAllowDecimal(a?.allowDecimal === true);

    const rawPrice = typeof a?.unitPrice === 'string' ? a.unitPrice : null;
    const currencyCode = typeof a?.currencyCode === 'string' ? a.currencyCode : null;
    if (rawPrice != null && currencyCode) {
      form.setValue(
        'unitPrice',
        { currency: currencyCode, value: minorToMajor(rawPrice, currencyCode) },
        { shouldDirty: false },
      );
    } else {
      form.setValue('unitPrice', undefined, { shouldDirty: false });
    }
  };

  const purchaseOrderItemId = form.watch('purchaseOrderItemId');
  const prefillNote = purchaseOrderItemId
    ? 'Pre-filled from the linked purchase order — edit if the supplier delivered at a different price.'
    : undefined;

  return (
    <Form form={form} mutation={mutation} onCancel={onCancel}>
      <PurchaseOrderItemSelector
        name="purchaseOrderItemId"
        label="Purchase Order Item"
        params={{ purchaseOrderId: poId, excludeOnGoodsReceiptId: goodsReceiptId }}
        onOptionSelect={handleSelect}
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
        ? 'Pick a line from the linked purchase order. The price pre-fills from the PO.'
        : 'Pick a supplier item to receive on this goods receipt. The price pre-fills from the supplier catalog.'
    }
    content={(close) =>
      poId ? (
        <PurchaseOrderItemForm
          goodsReceiptId={goodsReceiptId}
          poId={poId}
          onSuccess={close}
          onCancel={close}
        />
      ) : (
        <SupplierItemForm
          goodsReceiptId={goodsReceiptId}
          supplierId={supplierId}
          onSuccess={close}
          onCancel={close}
        />
      )
    }
  />
);
