import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateInventoryItem } from '@/hooks/inventory-items';
import {
  type InventoryItemData,
  type UpdateInventoryItemFormData,
  updateInventoryItemSchema,
} from '@/schemas/inventory-items';

interface EditInventoryItemFormProps {
  item: InventoryItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

const typeOptions = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'PRODUCT', label: 'Product' },
];

export const EditInventoryItemForm: React.FC<EditInventoryItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<UpdateInventoryItemFormData>({
    resolver: zodResolver(updateInventoryItemSchema),
    defaultValues: {
      name: item.name,
      code: item.code,
      type: item.type,
      categoryId: item.categoryId,
      description: item.description ?? '',
      uomId: item.uomId,
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
      <RadioGroup name="type" label="Type" options={typeOptions} orientation="horizontal" />
      <TextField name="name" label="Name" placeholder="e.g. Basmati Rice" />
      <TextField name="code" label="Code" placeholder="e.g. RAW-RICE-BAS" />
      <CategorySelector name="categoryId" />
      <TextArea name="description" label="Description" placeholder="Optional description" />
      <UomSelector name="uomId" label="Unit of Measure" placeholder="Select unit" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
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
