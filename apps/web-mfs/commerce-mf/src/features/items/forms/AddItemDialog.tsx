import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateItem } from '@/hooks/items';
import { useTaxGroups } from '@/hooks/tax-groups';
import { type CreateItemFormData, createItemSchema, ITEM_TYPE_OPTIONS } from '@/schemas/items';

interface AddItemDialogProps {
  businessUnitId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

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
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel} transformSubmit={(data) => data}>
      <Select name="type" label="Item Type" placeholder="Select type" options={ITEM_TYPE_OPTIONS} />

      <TextField name="name" label="Name" placeholder="e.g. Chicken Burger" />

      <div className="grid grid-cols-2 gap-4">
        <CategorySelector name="categoryId" params={{ buId: businessUnitId, status: 'active' }} clearable />
        <Select
          name="taxGroupId"
          label="Tax Group"
          placeholder="Select tax group (optional)"
          options={taxGroupOptions}
        />
      </div>

      <TextArea name="description" label="Description" placeholder="Optional description for this item" rows={3} />

      <Switch name="isAvailable" label="Available for ordering" description="When off, the item is hidden from POS and order forms" />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
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
