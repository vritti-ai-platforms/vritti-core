import { ORG_OFFERINGS } from '@vritti/commerce-permissions/offerings';
import { Button } from '@vritti/quantum-ui/Button';
import { Checkbox } from '@vritti/quantum-ui/Checkbox';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateInventoryItem } from '@/hooks/organization/inventory-items';
import {
  type CreateOrgInventoryItemFormData,
  createOrgInventoryItemSchema,
  InventoryItemTypeValues,
  InventoryPickStrategyValues,
  InventoryTrackingValues,
  inventoryItemTypeOptions,
  pickStrategyOptions,
  trackingOptions,
} from '@/schemas/inventory-items';
import { CategorySelector } from '@/selectors/category';
import { TaxClassSelector } from '@/selectors/tax-class';
import { UomSelector } from '@/selectors/uom';

interface AddInventoryItemDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddInventoryItemDialog: React.FC<AddInventoryItemDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateOrgInventoryItemFormData>({
    resolver: zodResolver(createOrgInventoryItemSchema),
    defaultValues: {
      name: '',
      sku: '',
      type: InventoryItemTypeValues.RAW_MATERIAL,
      tracking: InventoryTrackingValues.LOT,
      pickStrategy: InventoryPickStrategyValues.NONE,
      description: '',
      hsnCode: '',
      createOffering: false,
    },
  });

  const tracking = useWatch({ control: form.control, name: 'tracking' });
  const createMutation = useCreateInventoryItem({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="flex flex-col gap-6">
        <FormSection title="Basic Info" contentClassName="block">
          <div className="grid grid-cols-3 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
            <TextField name="sku" label="SKU" placeholder="e.g. raw-rice-bas" />
            <Select name="type" label="Type" placeholder="Select type" options={inventoryItemTypeOptions} />
            <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
            <div className="col-span-2">
              <CategorySelector
                name="categoryId"
                fieldKeys={{
                  valueKey: 'id',
                  labelKey: 'name',
                  descriptionKey: 'path',
                  additionalKeys: 'defaultTaxClassId',
                }}
                onOptionSelect={(option) => {
                  const defaultTaxClassId = option?.additionals?.defaultTaxClassId;
                  if (typeof defaultTaxClassId === 'string' && !form.getFieldState('taxClassId').isDirty) {
                    form.setValue('taxClassId', defaultTaxClassId, { shouldValidate: true });
                  }
                }}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Tracking" contentClassName="block">
          <div className="grid grid-cols-2 gap-6">
            <RadioGroup name="tracking" label="Tracking Method" options={trackingOptions} />
            {tracking !== InventoryTrackingValues.QUANTITY && (
              <RadioGroup name="pickStrategy" label="Pick Strategy" options={pickStrategyOptions} />
            )}
          </div>
        </FormSection>

        <FormSection title="Compliance" contentClassName="block">
          <div className="grid grid-cols-2 gap-4">
            <TextField name="hsnCode" label="HSN Code" placeholder="e.g. 1006" />
            <TaxClassSelector name="taxClassId" />
          </div>
        </FormSection>

        <FormSection title="Selling" contentClassName="block">
          <Checkbox
            name="createOffering"
            label="Create offering"
            description="Also create a stock offering for this item: one variant, with this item as its only component (quantity 1)."
            permission={ORG_OFFERINGS.add}
          />
        </FormSection>

        <FormSection title="Notes" contentClassName="block">
          <TextArea name="description" label="Description" placeholder="Optional description" />
        </FormSection>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Item
        </Button>
      </DialogActions>
    </Form>
  );
};
