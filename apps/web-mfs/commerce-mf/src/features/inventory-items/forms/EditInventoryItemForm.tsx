import { Button } from '@vritti/quantum-ui/Button';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateInventoryItem } from '@/hooks/inventory-items';
import { useTaxGroups } from '@/hooks/tax-groups';
import {
  type InventoryItemData,
  inventoryItemTypeOptions,
  type UpdateInventoryItemFormData,
  updateInventoryItemSchema,
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
  const { id: buId } = useSlugParams('buSlug');

  const form = useForm<UpdateInventoryItemFormData>({
    resolver: zodResolver(updateInventoryItemSchema),
    defaultValues: {
      name: item.name,
      code: item.code,
      type: item.type,
      pickStrategy: item.pickStrategy,
      categoryId: item.categoryId,
      description: item.description ?? '',
      uomId: item.uomId,
      purchaseTaxGroupId: item.purchaseTaxGroupId ?? undefined,
      hsnCode: item.hsnCode ?? '',
    },
  });

  const updateMutation = useUpdateInventoryItem({ onSuccess });
  const { data: taxGroups = [] } = useTaxGroups(buId || null);
  const taxGroupOptions = taxGroups.map((t) => ({ value: t.id, label: t.name }));

  return (
    <Form form={form} mutation={updateMutation} onCancel={onCancel} transformSubmit={(data) => ({ id: item.id, data })}>
      <div className="flex flex-col gap-6">
        <FormSection title="Basic Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
            <TextField name="code" label="Code" placeholder="e.g. RAW-RICE-BAS" />
            <Select name="type" label="Type" placeholder="Select type" options={inventoryItemTypeOptions} />
            <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
            <div className="sm:col-span-2">
              <CategorySelector name="categoryId" />
            </div>
          </div>
        </FormSection>

        {item.tracking !== 'quantity' && (
          <FormSection title="Picking" description="Order in which stock is consumed from inventory.">
            <RadioGroup name="pickStrategy" label="Pick Strategy" options={pickStrategyOptions} />
          </FormSection>
        )}

        <FormSection title="Tax & Compliance" description="Purchase tax and HSN classification for this item.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              name="purchaseTaxGroupId"
              label="Purchase Tax Group"
              placeholder="Select tax group (optional)"
              options={taxGroupOptions}
            />
            <TextField name="hsnCode" label="HSN Code" placeholder="e.g. 1006" />
          </div>
        </FormSection>

        <FormSection title="Notes">
          <TextArea name="description" label="Description" placeholder="Optional description" />
        </FormSection>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-6">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
