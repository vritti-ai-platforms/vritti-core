import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddSupplierItem } from '@/hooks/legal-entity/suppliers';
import { type AddSupplierItemFormData, addSupplierItemSchema } from '@/schemas/suppliers';
import { EnrolledSiteSelector } from '@/selectors/enrolled-site';
import { InventoryItemSelector } from '@/selectors/inventory-item';
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
      defaultLeadTimeDays: 0,
      siteIds: [],
    },
  });

  const addMutation = useAddSupplierItem(supplierId, { onSuccess });
  const inventoryItemId = useWatch({ control: form.control, name: 'inventoryItemId' });
  const [allowDecimal, setAllowDecimal] = useState(true);

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
        defaultLeadTimeDays: data.defaultLeadTimeDays,
        siteIds: data.siteIds,
      })}
    >
      <div className="space-y-6">
        <FormSection title="Item">
          <div className="col-span-2">
            <InventoryItemSelector
              name="inventoryItemId"
              label="Inventory Item"
              placeholder="Select item"
              onOptionSelect={() => form.resetField('uomId')}
              params={{ excludeOnSupplierId: supplierId }}
            />
          </div>
          <UomSelector
            name="uomId"
            label="Unit of Measure"
            placeholder={inventoryItemId ? 'Select unit' : 'Select inventory item first'}
            disabled={!inventoryItemId}
            params={inventoryItemId ? { inventoryItemId, supplierId } : undefined}
            onOptionSelect={(option) => setAllowDecimal(option?.additionals?.allowDecimal !== false)}
            description="The unit the supplier sells and prices it in"
          />
          <TextField
            name="supplierItemCode"
            label="Supplier Item Code"
            placeholder="Optional"
            description="The supplier's own code for this item"
          />
        </FormSection>

        <FormSection title="Ordering Terms">
          <TextField
            name="minOrderQuantity"
            label="Min Order Qty"
            type="number"
            positive
            integer={!allowDecimal}
            placeholder="Optional, e.g. 10"
            description="The least the supplier sells per order, in this unit"
          />
          <TextField
            name="defaultLeadTimeDays"
            label="Default Lead Time (days)"
            type="number"
            integer
            min={0}
            max={365}
            placeholder="e.g. 5"
            description="0 is the same day as the order; every site follows it unless the site sets its own"
          />
        </FormSection>

        <FormSection title="Sites" contentClassName="block">
          <EnrolledSiteSelector
            name="siteIds"
            label="Sites"
            supplierId={supplierId}
            multiple
            description="Enrolled sites that buy this item from the supplier. Preferred and lead time can be set per site."
          />
        </FormSection>
      </div>
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
