import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { minorToMajor } from '@vritti/quantum-ui/money';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { SupplierItemSelector } from '@vritti/quantum-ui/selects/supplier-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import { useAddPurchaseOrderItem } from '@/hooks/purchase-orders';
import {
  type AddPurchaseOrderItemFormData,
  addPurchaseOrderItemSchema,
  type PurchaseOrderDetail,
} from '@/schemas/purchase-orders';
import { computeFreeQty } from '@/utils/freeQty';

const toOptionalNumber = (raw: unknown): number | undefined => {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

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
      uomQty: 0,
      unitPrice: undefined,
      schemeBuyQty: undefined,
      schemeFreeQty: undefined,
      hasScheme: false,
    },
  });

  const hasScheme = form.watch('hasScheme');
  const freeQtyPreview = computeFreeQty(
    form.watch('uomQty'),
    form.watch('schemeBuyQty'),
    form.watch('schemeFreeQty'),
    hasScheme,
  );

  const handleItemSelect = (option: SelectOption | null) => {
    const rawMinor = option?.additionals?.unitPrice;
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    if (rawMinor) {
      form.setValue('unitPrice', {
        currency: purchaseOrder.currencyCode,
        value: minorToMajor(rawMinor.toString(), purchaseOrder.currencyCode),
      });
    }
    // Prefill the standing scheme from the supplier item; buyer can edit at PO time.
    form.setValue('schemeBuyQty', toOptionalNumber(option?.additionals?.schemeBuyQty));
    form.setValue('schemeFreeQty', toOptionalNumber(option?.additionals?.schemeFreeQty));
    form.setValue('hasScheme', option?.additionals?.hasScheme === true);
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
        uomQty: data.uomQty,
        unitPrice: data.unitPrice as { currency: string; value: string },
        schemeBuyQty: data.schemeBuyQty,
        schemeFreeQty: data.schemeFreeQty,
        hasScheme: data.hasScheme,
      })}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <SupplierItemSelector
              name="supplierItemId"
              params={{ supplierId: purchaseOrder.supplierId, excludeOnPurchaseOrderId: purchaseOrder.id }}
              onOptionSelect={handleItemSelect}
            />
          </div>
          <TextField
            name="uomQty"
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
          {hasScheme && <FreeQtyPreview value={freeQtyPreview} />}
        </div>
        <Switch name="hasScheme" label="Free goods scheme" description="Supplier ships bonus units on this item." />
        {hasScheme && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="schemeBuyQty" label="Buy Quantity" type="number" integer positive />
            <TextField name="schemeFreeQty" label="Free Quantity" type="number" integer positive />
          </div>
        )}
      </div>
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
