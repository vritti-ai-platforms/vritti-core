import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddInventoryItemSupplier } from '@/hooks/legal-entity/inventory-items';
import { type AddInventoryItemSupplierFormData, addInventoryItemSupplierSchema } from '@/schemas/suppliers';
import { EnrolledSiteSelector } from '@/selectors/enrolled-site';
import { SupplierSelector } from '@/selectors/supplier';
import { UomSelector } from '@/selectors/uom';

interface AddInventoryItemSupplierFormProps {
  inventoryItemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Sets the item up as one of a supplier's items: the unit it sells it in, its ordering terms and the sites buying it
export const AddInventoryItemSupplierForm: React.FC<AddInventoryItemSupplierFormProps> = ({
  inventoryItemId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddInventoryItemSupplierFormData>({
    resolver: zodResolver(addInventoryItemSupplierSchema),
    defaultValues: {
      supplierItemCode: '',
      defaultLeadTimeDays: 0,
      siteIds: [],
    },
  });

  const addMutation = useAddInventoryItemSupplier(inventoryItemId, { onSuccess });
  const supplierId = useWatch({ control: form.control, name: 'supplierId' });
  const [allowDecimal, setAllowDecimal] = useState(true);

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        supplierItemCode: data.supplierItemCode,
        uomId: data.uomId,
        minOrderQuantity: data.minOrderQuantity,
        defaultLeadTimeDays: data.defaultLeadTimeDays,
        siteIds: data.siteIds,
      })}
    >
      <div className="space-y-6">
        <FormSection title="Supplier">
          <div className="col-span-2">
            <SupplierSelector
              name="supplierId"
              onOptionSelect={() => {
                form.resetField('uomId');
                form.resetField('siteIds');
              }}
            />
          </div>
          <UomSelector
            name="uomId"
            label="Unit of Measure"
            placeholder={supplierId ? 'Select unit' : 'Select supplier first'}
            disabled={!supplierId}
            params={supplierId ? { inventoryItemId, supplierId } : undefined}
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
            description="Sites enrolled with the supplier that buy this item from them. Preferred and lead time can be set per site."
          />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Supplier
        </Button>
      </DialogActions>
    </Form>
  );
};
