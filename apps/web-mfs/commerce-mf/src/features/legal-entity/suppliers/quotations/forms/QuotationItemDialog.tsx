import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddSupplierQuotationItem, useUpdateSupplierQuotationItem } from '@/hooks/legal-entity/supplier-quotations';
import {
  type AddSupplierQuotationItemFormData,
  addSupplierQuotationItemSchema,
  type SupplierQuotationItemData,
  type SupplierQuotationItemPayload,
} from '@/schemas/supplier-quotations';
import { InventoryItemSelector } from '@/selectors/inventory-item';
import { UomSelector } from '@/selectors/uom';

interface QuotationItemDialogProps {
  supplierId: string;
  quotationId: string;
  currencyCode: string;
  // Edits this line; without it the dialog adds a line for an item and unit the quotation does not have yet
  item?: SupplierQuotationItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const QuotationItemDialog: React.FC<QuotationItemDialogProps> = ({
  supplierId,
  quotationId,
  currencyCode,
  item,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddSupplierQuotationItemFormData>({
    resolver: zodResolver(addSupplierQuotationItemSchema),
    defaultValues: item
      ? {
          inventoryItemId: item.inventoryItemId,
          uomId: item.uomId,
          supplierItemCode: item.supplierItemCode ?? '',
          unitPrice: item.unitPrice,
          mrp: item.mrp ?? undefined,
          schemeBuyQty: item.schemeBuyQty,
          schemeFreeQty: item.schemeFreeQty,
          taxInclusive: item.taxInclusive,
        }
      : { supplierItemCode: '', taxInclusive: false },
  });
  // The item scopes the unit choices; the unit names what the price and MRP are per
  const inventoryItemId = useWatch({ control: form.control, name: 'inventoryItemId' });
  const [unitLabel, setUnitLabel] = useState<string | undefined>(item?.uomSymbol ?? undefined);

  const addMutation = useAddSupplierQuotationItem(supplierId, quotationId, { onSuccess });
  const updateMutation = useUpdateSupplierQuotationItem(supplierId, quotationId, { onSuccess });
  const canSetMrp = usePermission(LE_INVENTORY_ITEMS.mrp.edit).available;

  // The schema has already rejected an empty price by the time the form submits
  const toPayload = (data: AddSupplierQuotationItemFormData): SupplierQuotationItemPayload => ({
    supplierItemCode: data.supplierItemCode || null,
    unitPrice: data.unitPrice as SupplierQuotationItemPayload['unitPrice'],
    ...(canSetMrp ? { mrp: data.mrp?.value ? (data.mrp as SupplierQuotationItemPayload['unitPrice']) : null } : {}),
    schemeBuyQty: data.schemeBuyQty ?? null,
    schemeFreeQty: data.schemeFreeQty ?? null,
    taxInclusive: data.taxInclusive,
  });

  const body = (
    <>
      <div className="flex flex-col gap-6">
        <FormSection title="Item">
          <div className="col-span-2">
            <InventoryItemSelector
              name="inventoryItemId"
              label="Item"
              placeholder="Select item"
              disabled={!!item}
              onOptionSelect={() => {
                if (item) return;
                form.resetField('uomId');
                setUnitLabel(undefined);
              }}
            />
          </div>
          <UomSelector
            name="uomId"
            label="Unit"
            placeholder={inventoryItemId ? 'Select unit' : 'Select an item first'}
            disabled={!inventoryItemId || !!item}
            params={inventoryItemId ? { inventoryItemId } : undefined}
            onOptionSelect={(option) => setUnitLabel(option?.label)}
          />
          <TextField name="supplierItemCode" label="Supplier Code (optional)" placeholder="Supplier's code for it" />
        </FormSection>

        <FormSection title="Price">
          <CurrencyField
            name="unitPrice"
            label={unitLabel ? `Price per ${unitLabel}` : 'Unit Price'}
            currencyCode={currencyCode}
          />
          <CurrencyField
            name="mrp"
            permission={LE_INVENTORY_ITEMS.mrp.edit}
            label={unitLabel ? `MRP per ${unitLabel} (optional)` : 'MRP (optional)'}
            currencyCode={currencyCode}
            description="As printed on the pack; added to the item's MRPs if new"
          />
          <div className="col-span-2">
            <Switch
              name="taxInclusive"
              label="Price includes tax"
              description="On = the supplier quotes tax-inclusive; off = tax is added on top"
            />
          </div>
        </FormSection>

        <FormSection title="Free Goods Scheme">
          <TextField name="schemeBuyQty" label="Buy Qty" type="number" integer positive placeholder="e.g. 10" />
          <TextField name="schemeFreeQty" label="Free Qty" type="number" integer positive placeholder="e.g. 1" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          {item ? 'Save Line' : 'Add Line'}
        </Button>
      </DialogActions>
    </>
  );

  return item ? (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ itemId: item.id, data: toPayload(data) })}
    >
      {body}
    </Form>
  ) : (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ inventoryItemId: data.inventoryItemId, uomId: data.uomId, ...toPayload(data) })}
    >
      {body}
    </Form>
  );
};
