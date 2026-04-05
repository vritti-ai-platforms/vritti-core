import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCategories } from '@/hooks/useCategories';
import { useCreateItem } from '@/hooks/useCreateItem';
import { type CreateItemFormData, createItemSchema } from '@/schemas/items';

interface AddItemDialogProps {
  businessUnitId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const itemTypeOptions = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'SERVICE', label: 'Service' },
];

export const AddItemDialog: React.FC<AddItemDialogProps> = ({ businessUnitId, onSuccess, onCancel }) => {
  const form = useForm<CreateItemFormData>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      type: 'PRODUCT',
      name: '',
      categoryId: undefined,
      basePrice: '',
    },
  });

  const createMutation = useCreateItem({ onSuccess });
  const { data: categories = [] } = useCategories(businessUnitId);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        ...data,
        basePrice: Number(data.basePrice),
        businessUnitId,
      })}
    >
      <RadioGroup name="type" label="Item Type" options={itemTypeOptions} orientation="horizontal" />
      <TextField name="name" label="Name" placeholder="e.g. Chicken Burger" />
      <Select
        name="categoryId"
        label="Category"
        placeholder="Select a category"
        options={categoryOptions}
      />
      <TextField name="basePrice" label="Base Price" type="number" placeholder="0.00" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Item
        </Button>
      </div>
  </Form>
  );
};
