import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
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
    },
  });

  const updateMutation = useUpdateSupplierItem(supplierId, { onSuccess });
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
        },
      })}
    >
      <InventoryItemSelector
        label="Inventory Item"
        value={item.inventoryItemId}
        params={{ values: item.inventoryItemId }}
        disabled
      />
      <TextField name="supplierItemCode" label="Supplier Item Code" placeholder="Supplier's code for this item" />
      <UomSelector
        name="uomId"
        label="Unit of Measure"
        placeholder="Select unit"
        params={{ inventoryItemId: item.inventoryItemId, supplierId }}
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
          positive
        />
      </div>
      <TextField name="leadTimeDays" label="Lead Time (days)" type="number" placeholder="e.g. 3" integer positive />
      <Switch name="isPreferred" label="Preferred Supplier" />
      <Switch name="isActive" label="Active" />
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
