import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TextField } from '@vritti/quantum-ui/TextField';
import type { AxiosError } from 'axios';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CategoryData, type CategoryFormData, categoryFormResolver } from '@/schemas/categories';
import { createCategory, updateCategory } from '@/services/categories.service';

interface CategoryFormProps {
  category?: CategoryData;
  businessUnitId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ category, businessUnitId, onSuccess, onCancel }) => {
  const isEditing = !!category;
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    resolver: categoryFormResolver,
    defaultValues: {
      name: category?.name ?? '',
      parentId: category?.parentId ?? null,
      sortOrder: category?.sortOrder ?? 1,
      isActive: category?.isActive ?? true,
    },
  });

  const mutation = useMutation<void, AxiosError, CategoryFormData>({
    mutationFn: async (data) => {
      const coerced = {
        ...data,
        sortOrder: Number(data.sortOrder),
        parentId: data.parentId || null,
      };
      if (isEditing) {
        await updateCategory({ id: category.id, data: coerced });
      } else {
        await createCategory({ ...coerced, businessUnitId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onSuccess();
    },
  });

  const watchedParentId = form.watch('parentId');

  return (
    <Form form={form} mutation={mutation} showRootError resetOnSuccess={!isEditing} onCancel={onCancel}>
      <TextField name="name" label="Name" placeholder="e.g. Electronics" />
      <CategorySelector
        label="Parent Category"
        name="parentId"
        placeholder="None (root category)"
        value={watchedParentId ?? undefined}
        params={{
          buId: businessUnitId,
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
