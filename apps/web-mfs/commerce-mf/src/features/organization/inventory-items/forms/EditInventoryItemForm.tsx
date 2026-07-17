import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TaxClassSelector } from '@vritti/quantum-ui/selects/tax-class';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateInventoryItem } from '@/hooks/organization/inventory-items';
import {
  type InventoryItemData,
  inventoryItemTypeOptions,
  type UpdateOrgInventoryItemFormData,
  updateOrgInventoryItemSchema,
} from '@/schemas/inventory-items';

interface EditInventoryItemFormProps {
  item: InventoryItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

const pickStrategyOptions = [
  { value: 'none', label: 'None — free pick' },
  { value: 'fifo', label: 'FIFO — oldest received first' },
  { value: 'fefo', label: 'FEFO — nearest expiry first' },
];

export const EditInventoryItemForm: React.FC<EditInventoryItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<UpdateOrgInventoryItemFormData>({
    resolver: zodResolver(updateOrgInventoryItemSchema),
    defaultValues: {
      name: item.name,
      code: item.code,
      type: item.type,
      pickStrategy: item.pickStrategy,
      categoryId: item.categoryId,
      description: item.description ?? '',
      uomId: item.uomId,
      hsnCode: item.hsnCode ?? '',
      taxClassId: item.taxClassId ?? undefined,
    },
  });

  const updateMutation = useUpdateInventoryItem({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: item.id,
        data,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Basic Info" contentClassName="block">
          <div className="grid grid-cols-3 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
            <TextField name="code" label="Code" placeholder="e.g. RAW-RICE-BAS" />
            <Select name="type" label="Type" placeholder="Select type" options={inventoryItemTypeOptions} />
            <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
            <div className="col-span-2">
              <CategorySelector
                name="categoryId"
                fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'path', additionalKeys: 'defaultTaxClassId' }}
                onOptionSelect={(o) => {
                  const defaultTaxClassId = o?.additionals?.defaultTaxClassId as string | null | undefined;
                  if (defaultTaxClassId) {
                    form.setValue('taxClassId', defaultTaxClassId, { shouldValidate: true, shouldDirty: true });
                  }
                }}
              />
            </div>
          </div>
        </FormSection>

        {item.tracking !== 'quantity' && (
          <FormSection title="Tracking" contentClassName="block">
            <RadioGroup name="pickStrategy" label="Pick Strategy" options={pickStrategyOptions} />
          </FormSection>
        )}

        <FormSection title="Compliance" contentClassName="block">
          <div className="grid grid-cols-2 gap-4">
            <TextField name="hsnCode" label="HSN Code" placeholder="e.g. 1006" />
            <TaxClassSelector name="taxClassId" />
          </div>
        </FormSection>

        <FormSection title="Notes" contentClassName="block">
          <TextArea name="description" label="Description" placeholder="Optional description" />
        </FormSection>
      </div>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
