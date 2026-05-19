import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAllowedUomIds } from '@/hooks/inventory-items';
import { useLinkSupplierItem } from '@/hooks/suppliers';
import { type LinkSupplierItemFormData, linkSupplierItemSchema } from '@/schemas/suppliers';

interface AddSupplierItemDialogProps {
  supplierId: string;
  supplierCurrencyCode?: string;
  existingInventoryItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierItemDialog: React.FC<AddSupplierItemDialogProps> = ({
  supplierId,
  supplierCurrencyCode,
  existingInventoryItemIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<LinkSupplierItemFormData>({
    resolver: zodResolver(linkSupplierItemSchema),
    defaultValues: {
      inventoryItemId: '',
      supplierItemCode: '',
      unitPrice: undefined,
      uomId: '',
      minOrderQuantity: undefined,
      leadTimeDays: undefined,
      isPreferred: false,
    },
  });

  const linkMutation = useLinkSupplierItem(supplierId, { onSuccess });
  const inventoryItemId = useWatch({ control: form.control, name: 'inventoryItemId' });
  const [allowDecimal, setAllowDecimal] = useState(true);
  const { data: allowedUomIds, isFetching: isLoadingAllowed } = useAllowedUomIds(inventoryItemId || null);

  // Reset UOM when item changes so a stale selection doesn't survive into the new allowed set
  useEffect(() => {
    form.setValue('uomId', '');
  }, [form]);

  const existingItemIds = existingInventoryItemIds.join(',');
  const uomDisabled = !inventoryItemId || isLoadingAllowed || !allowedUomIds;

  return (
    <Form
      form={form}
      mutation={linkMutation}
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
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        params={{ excludeIds: existingItemIds }}
      />
      <TextField name="supplierItemCode" label="Supplier Item Code" placeholder="Supplier's code for this item" />
      <UomSelector
        name="uomId"
        label="Unit of Measure"
        placeholder={inventoryItemId ? 'Select unit' : 'Select inventory item first'}
        disabled={uomDisabled}
        params={allowedUomIds ? { values: allowedUomIds.join(',') } : undefined}
        onOptionSelect={(option) => setAllowDecimal(option?.additionals?.allowDecimal !== false)}
      />
      <div className="grid grid-cols-2 gap-4">
        <CurrencyField name="unitPrice" label="Unit Price" defaultCurrencyCode={supplierCurrencyCode} />
        <TextField
          name="minOrderQuantity"
          label="Min Order Qty"
          type="number"
          placeholder="e.g. 100"
          integer={!allowDecimal}
        />
      </div>
      <TextField name="leadTimeDays" label="Lead Time (days)" type="number" placeholder="e.g. 3" />
      <Switch name="isPreferred" label="Preferred Supplier" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Linking...">
          Link Item
        </Button>
      </div>
    </Form>
  );
};
