import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
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

const AddItemForm = ({
  goodsReceiptId,
  supplierId,
  poId,
  onSuccess,
  onCancel,
}: AddItemDialogContext & { onSuccess: () => void; onCancel: () => void }) => {
  const form = useForm<AddGoodsReceiptItemFormData>({
    resolver: zodResolver(addGoodsReceiptItemSchema),
    defaultValues: { supplierItemId: '', rejectedQuantity: undefined },
  });
  const mutation = useAddGoodsReceiptItem(goodsReceiptId, { onSuccess });
  // The picked supplier item's UOM dictates whether the rejected qty input allows decimals (e.g.
  // a "case" UOM is whole-number-only, a "kg" UOM allows fractions).
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);

  const handleItemSelect = (option: SelectOption | null) => {
    setAllowDecimal(option?.additionals?.allowDecimal === true);
  };

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierItemId: data.supplierItemId,
        rejectedQuantity: data.rejectedQuantity,
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
        ? 'Pick a supplier item from the linked purchase order.'
        : 'Pick a supplier item to receive on this goods receipt.'
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
