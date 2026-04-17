import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useSupplierItemIds } from '@/hooks/useSupplierItemIds';
import { useLinkSupplierItem } from '@/hooks/useLinkSupplierItem';
import { type LinkSupplierItemFormData, linkSupplierItemSchema } from '@/schemas/suppliers';

interface AddSupplierItemDialogProps {
  supplierId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierItemDialog: React.FC<AddSupplierItemDialogProps> = ({ supplierId, onSuccess, onCancel }) => {
  const form = useForm<LinkSupplierItemFormData>({
    resolver: zodResolver(linkSupplierItemSchema),
    defaultValues: {
      inventoryItemId: '',
      supplierCode: '',
      unitPrice: '',
      uomId: '',
      minOrderQuantity: '',
      leadTimeDays: '',
      isPreferred: false,
    },
  });

  const linkMutation = useLinkSupplierItem(supplierId, { onSuccess });
  const { data: existingItemIdsList } = useSupplierItemIds(supplierId);

  // Exclude already linked items
  const existingItemIds = (existingItemIdsList ?? []).join(',');

  return (
    <Form
      form={form}
      mutation={linkMutation}
     
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        supplierCode: data.supplierCode || undefined,
        unitPrice: data.unitPrice ? Number(data.unitPrice) : undefined,
        uomId: data.uomId,
        minOrderQuantity: data.minOrderQuantity ? Number(data.minOrderQuantity) : undefined,
        leadTimeDays: data.leadTimeDays ? Number(data.leadTimeDays) : undefined,
        isPreferred: data.isPreferred,
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        params={{ excludeIds: existingItemIds }}
      />
      <TextField name="supplierCode" label="Supplier Code" placeholder="Supplier's code for this item" />
      <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
      <div className="grid grid-cols-2 gap-4">
        <TextField name="unitPrice" label="Unit Price" type="number" placeholder="e.g. 150.00" />
        <TextField name="minOrderQuantity" label="Min Order Qty" type="number" placeholder="e.g. 100" />
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
