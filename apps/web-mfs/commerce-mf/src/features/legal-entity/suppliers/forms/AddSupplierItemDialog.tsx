import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddSupplierItem } from '@/hooks/legal-entity/suppliers';
import { type AddSupplierItemFormData, addSupplierItemSchema } from '@/schemas/suppliers';
import { InventoryItemSelector } from '@/selectors/inventory-item';
import { SupplierSiteSelector } from '@/selectors/supplier-site';
import { UomSelector } from '@/selectors/uom';

interface AddSupplierItemDialogProps {
  supplierId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierItemDialog: React.FC<AddSupplierItemDialogProps> = ({ supplierId, onSuccess, onCancel }) => {
  const form = useForm<AddSupplierItemFormData>({
    resolver: zodResolver(addSupplierItemSchema),
    defaultValues: {
      supplierItemCode: '',
      siteIds: [],
    },
  });

  const addMutation = useAddSupplierItem(supplierId, { onSuccess });
  const inventoryItemId = useWatch({ control: form.control, name: 'inventoryItemId' });

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        supplierItemCode: data.supplierItemCode,
        uomId: data.uomId,
        minOrderQuantity: data.minOrderQuantity,
        leadTimeDays: data.leadTimeDays,
        siteIds: data.siteIds,
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        onOptionSelect={() => form.resetField('uomId')}
        params={{ excludeOnSupplierId: supplierId }}
      />
      <UomSelector
        name="uomId"
        label="Unit of Measure"
        placeholder={inventoryItemId ? 'Select unit' : 'Select inventory item first'}
        disabled={!inventoryItemId}
        params={inventoryItemId ? { inventoryItemId, supplierId } : undefined}
      />
      <TextField name="supplierItemCode" label="Supplier Item Code" placeholder="Supplier's code for this item" />
      <TextField
        name="minOrderQuantity"
        label="Min Order Qty (optional)"
        type="number"
        positive
        placeholder="e.g. 10"
        description="The least the supplier sells per order, in this unit"
      />
      <TextField
        name="leadTimeDays"
        label="Lead Time (days, optional)"
        type="number"
        integer
        positive
        placeholder="e.g. 5"
        description="Every site follows it unless the site sets its own"
      />
      <SupplierSiteSelector
        name="siteIds"
        supplierId={supplierId}
        multiple
        description="Sites that buy this item from the supplier. Preferred, lead time and min order are set per site."
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Item
        </Button>
      </DialogActions>
    </Form>
  );
};
