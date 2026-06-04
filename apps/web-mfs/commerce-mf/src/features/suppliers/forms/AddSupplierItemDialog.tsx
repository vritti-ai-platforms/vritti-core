import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddSupplierItem } from '@/hooks/suppliers';
import { type AddSupplierItemFormData, addSupplierItemSchema } from '@/schemas/suppliers';

interface AddSupplierItemDialogProps {
  supplierId: string;
  supplierCurrencyCode?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierItemDialog: React.FC<AddSupplierItemDialogProps> = ({
  supplierId,
  supplierCurrencyCode,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddSupplierItemFormData>({
    resolver: zodResolver(addSupplierItemSchema),
    defaultValues: {
      inventoryItemId: '',
      supplierItemCode: '',
      unitPrice: undefined,
      uomId: '',
      minOrderQuantity: undefined,
      leadTimeDays: undefined,
      isPreferred: false,
      schemeBuyQty: undefined,
      schemeFreeQty: undefined,
      hasScheme: false,
    },
  });

  const addMutation = useAddSupplierItem(supplierId, { onSuccess });
  const inventoryItemId = useWatch({ control: form.control, name: 'inventoryItemId' });
  const hasScheme = useWatch({ control: form.control, name: 'hasScheme' });
  const [allowDecimal, setAllowDecimal] = useState(true);

  const uomDisabled = !inventoryItemId;

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        supplierItemCode: data.supplierItemCode || undefined,
        unitPrice: data.unitPrice,
        uomId: data.uomId,
        minOrderQuantity: data.minOrderQuantity ?? undefined,
        leadTimeDays: data.leadTimeDays ?? undefined,
        isPreferred: data.isPreferred,
        schemeBuyQty: data.schemeBuyQty ?? undefined,
        schemeFreeQty: data.schemeFreeQty ?? undefined,
        hasScheme: data.hasScheme,
      })}
    >
      <FormSection title="Item">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InventoryItemSelector
                name="inventoryItemId"
                label="Inventory Item"
                placeholder="Select item"
                onOptionSelect={() => form.setValue('uomId', '')}
                params={{ excludeOnSupplierId: supplierId }}
              />
            </div>
            <UomSelector
              name="uomId"
              label="Unit of Measure"
              placeholder={inventoryItemId ? 'Select unit' : 'Select inventory item first'}
              disabled={uomDisabled}
              params={inventoryItemId ? { inventoryItemId, supplierId } : undefined}
              onOptionSelect={(option) => setAllowDecimal(option?.additionals?.allowDecimal !== false)}
            />
            <TextField name="supplierItemCode" label="Supplier Item Code" placeholder="Supplier's code for this item" />
            <CurrencyField name="unitPrice" label="Unit Price" currencyCode={supplierCurrencyCode} />
            <TextField
              name="minOrderQuantity"
              label="Min Order Qty"
              type="number"
              placeholder="e.g. 100"
              integer={!allowDecimal}
              positive
            />
            <TextField
              name="leadTimeDays"
              label="Lead Time (days)"
              type="number"
              placeholder="e.g. 3"
              integer
              positive
            />
          </div>
          <Switch
            name="isPreferred"
            label="Preferred Supplier"
            description="Surfaced first when picking suppliers for this item"
          />
        </div>
      </FormSection>
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
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Item
        </Button>
      </div>
    </Form>
  );
};
