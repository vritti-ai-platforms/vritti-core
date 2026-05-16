import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCategory, useUpdateCategory } from '@/hooks/categories';
import { type CategoryData, type CategoryFormData, categoryFormResolver } from '@/schemas/categories';

interface CategoryFormProps {
  category?: CategoryData;
  defaultParentId?: string | null;
  disableParentSelector?: boolean;
  businessUnitId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  defaultParentId,
  disableParentSelector = false,
  businessUnitId,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: categoryFormResolver,
    defaultValues: {
      name: category?.name ?? '',
      parentId: category?.parentId ?? defaultParentId ?? null,
      sortOrder: category?.sortOrder ?? 1,
      isActive: category?.isActive ?? true,
    },
  });

  const createMutation = useCreateCategory({ onSuccess });
  const updateMutation = useUpdateCategory({ onSuccess });

  const watchedParentId = form.watch('parentId');

  const handleSubmit = async (data: CategoryFormData) => {
    const coerced = {
      ...data,
      sortOrder: data.sortOrder,
      parentId: data.parentId || null,
    };
    if (isEditing) {
      await updateMutation.mutateAsync({ id: category.id, data: coerced });
    } else {
      await createMutation.mutateAsync(coerced);
    }
  };

  return (
    <Form form={form} onSubmit={handleSubmit} resetOnSuccess={!isEditing} onCancel={onCancel}>
      <TextField name="name" label="Name" placeholder="e.g. Electronics" />
      <CategorySelector
        label="Parent Category"
        name="parentId"
        placeholder="None (root category)"
        value={watchedParentId ?? undefined}
        disabled={disableParentSelector}
        params={{
          buId: businessUnitId,
          status: 'active',
          ...(isEditing && {
            excludeIds: [category.id, category.parentId].filter(Boolean).join(','),
          }),
        }}
        clearable
      />
      <TextField name="sortOrder" label="Sort Order" type="number" placeholder="1" />
      <Switch name="isActive" label="Active" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText={isEditing ? 'Saving...' : 'Creating...'}>
          {isEditing ? 'Save Changes' : 'Add Category'}
        </Button>
      </div>
    </Form>
  );
};
