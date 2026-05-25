import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { minorToMajor } from '@vritti/quantum-ui/money';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { SupplierItemSelector } from '@vritti/quantum-ui/selects/supplier-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddPurchaseOrderItem } from '@/hooks/purchase-orders';
import {
  type AddPurchaseOrderItemFormData,
  addPurchaseOrderItemSchema,
  type PurchaseOrderDetail,
} from '@/schemas/purchase-orders';

interface AddPurchaseOrderItemDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddPurchaseOrderItemDialog: React.FC<AddPurchaseOrderItemDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const mutation = useAddPurchaseOrderItem({ onSuccess });

  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);

  const form = useForm<AddPurchaseOrderItemFormData>({
    resolver: zodResolver(addPurchaseOrderItemSchema),
    defaultValues: {
      supplierItemId: '',
      quantity: 0,
      unitPrice: undefined,
    },
  });

  const handleItemSelect = (option: SelectOption | null) => {
    const rawMinor = option?.additionals?.unitPrice;
    const catalogUnitPrice =
      rawMinor != null ? Number(minorToMajor(String(rawMinor), purchaseOrder.currencyCode)) : null;

    setAllowDecimal(option?.additionals?.allowDecimal === true);

    form.setValue(
      'unitPrice',
      catalogUnitPrice != null
        ? { currency: purchaseOrder.currencyCode, value: String(catalogUnitPrice) }
        : undefined,
    );
  };

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        supplierItemId: data.supplierItemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice as { currency: string; value: string },
      })}
    >
      <SupplierItemSelector
        name="supplierItemId"
        params={{ supplierId: purchaseOrder.supplierId, purchaseOrderId: purchaseOrder.id }}
        onOptionSelect={handleItemSelect}
      />
      <TextField
        name="quantity"
        label="Quantity"
        type="number"
        placeholder="e.g. 500"
        integer={!allowDecimal}
        positive
      />
      <CurrencyField
        name="unitPrice"
        label="Unit Price"
        currencyCode={purchaseOrder.currencyCode}
        placeholder="Enter unit price"
      />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Line Item
        </Button>
      </div>
    </Form>
  );
};
