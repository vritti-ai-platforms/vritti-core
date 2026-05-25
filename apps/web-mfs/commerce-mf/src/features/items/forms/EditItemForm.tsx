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
import { useUpdateItem } from '@/hooks/items';
import { useTaxGroups } from '@/hooks/tax-groups';
import { type ItemDetail, type UpdateItemFormData, updateItemSchema } from '@/schemas/items';

interface EditItemFormProps {
  item: ItemDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditItemForm: React.FC<EditItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<UpdateItemFormData>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description ?? '',
      taxGroupId: item.taxGroupId ?? undefined,
      categoryId: item.categoryId ?? undefined,
      isAvailable: item.isAvailable,
    },
  });

  const updateMutation = useUpdateItem({ onSuccess });
  const { data: taxGroups = [] } = useTaxGroups(item.businessUnitId);
  const taxGroupOptions = taxGroups.map((tg) => ({
    value: tg.id,
    label: tg.name,
    description: tg.taxRates.map((r) => `${r.name} ${r.rate}%`).join(', '),
  }));

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: item.id,
        data: {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId ?? null,
          taxGroupId: data.taxGroupId || null,
          isAvailable: data.isAvailable,
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="Item name" />

      <div className="grid grid-cols-2 gap-4">
        <CategorySelector name="categoryId" params={{ buId: item.businessUnitId, status: 'active' }} clearable />
        <Select
          name="taxGroupId"
          label="Tax Group"
          placeholder="Select tax group (optional)"
          options={taxGroupOptions}
        />
      </div>

      <TextArea name="description" label="Description" placeholder="Optional description" rows={3} />

      <Switch name="isAvailable" label="Available for ordering" description="When off, the item is hidden from POS and order forms" />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
