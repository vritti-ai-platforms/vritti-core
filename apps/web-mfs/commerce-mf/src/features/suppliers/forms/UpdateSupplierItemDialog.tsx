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
import { useForm } from 'react-hook-form';
import { useUpdateSupplierItem } from '@/hooks/suppliers';
import { type SupplierItemData, type UpdateSupplierItemFormData, updateSupplierItemSchema } from '@/schemas/suppliers';

interface UpdateSupplierItemDialogProps {
  supplierId: string;
  supplierCurrencyCode?: string;
  item: SupplierItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UpdateSupplierItemDialog: React.FC<UpdateSupplierItemDialogProps> = ({
  supplierId,
  supplierCurrencyCode,
  item,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierItemFormData>({
    resolver: zodResolver(updateSupplierItemSchema),
    defaultValues: {
      supplierItemCode: item.supplierItemCode ?? '',
      unitPrice: item.unitPrice,
      uomId: item.uomId,
      minOrderQuantity: item.minOrderQuantity ?? undefined,
      leadTimeDays: item.leadTimeDays ?? undefined,
      isPreferred: item.isPreferred,
      isActive: item.isActive,
      taxInclusive: item.taxInclusive,
      schemeBuyQty: item.schemeBuyQty ?? undefined,
      schemeFreeQty: item.schemeFreeQty ?? undefined,
      hasScheme: item.hasScheme ?? false,
    },
  });

  const updateMutation = useUpdateSupplierItem(supplierId, { onSuccess });
  const hasScheme = form.watch('hasScheme');
  const [allowDecimal, setAllowDecimal] = useState(true);

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        itemId: item.id,
        data: {
          supplierItemCode: data.supplierItemCode ? data.supplierItemCode : null,
          unitPrice: data.unitPrice,
          uomId: data.uomId,
          minOrderQuantity: data.minOrderQuantity ?? null,
          leadTimeDays: data.leadTimeDays ?? null,
          isPreferred: data.isPreferred,
          isActive: data.isActive,
          taxInclusive: data.taxInclusive,
          schemeBuyQty: data.schemeBuyQty ?? null,
          schemeFreeQty: data.schemeFreeQty ?? null,
          hasScheme: data.hasScheme,
        },
      })}
    >
      <FormSection title="Item">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <InventoryItemSelector
                label="Inventory Item"
                value={item.inventoryItemId}
                params={{ values: item.inventoryItemId }}
                disabled
              />
            </div>
            <UomSelector
              name="uomId"
              label="Unit of Measure"
              placeholder="Select unit"
              params={{ inventoryItemId: item.inventoryItemId, supplierId }}
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
            name="taxInclusive"
            label="Price includes tax"
            description="On = supplier price is tax-inclusive; off = tax added on top"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Switch
              name="isPreferred"
              label="Preferred Supplier"
              description="Surfaced first when picking suppliers for this item"
            />
            <Switch name="isActive" label="Active" description="Inactive supplier items can't be added to new POs" />
          </div>
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
