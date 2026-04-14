import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateItem } from '@/hooks/useCreateItem';
import { useTaxGroups } from '@/hooks/useTaxGroups';
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
      description: '',
      categoryId: undefined,
      taxGroupId: undefined,
      isAvailable: true,
    },
  });

  const createMutation = useCreateItem({ onSuccess });
  const { data: taxGroups = [] } = useTaxGroups(businessUnitId);

  const taxGroupOptions = taxGroups.map((t) => ({ value: t.id, label: t.name }));

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        ...data,
        businessUnitId,
      })}
    >
      <RadioGroup name="type" label="Item Type" options={itemTypeOptions} orientation="horizontal" />
      <TextField name="name" label="Name" placeholder="e.g. Chicken Burger" />
      <TextArea name="description" label="Description" placeholder="Optional description" />
      <CategorySelector name="categoryId" params={{ buId: businessUnitId, status: 'active' }} clearable />
      <Select name="taxGroupId" label="Tax Group" placeholder="Select tax group" options={taxGroupOptions} />
      <Switch name="isAvailable" label="Available" />
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
