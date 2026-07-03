import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { CategorySelector } from '@vritti/quantum-ui/selects/category';
import { TaxGroupSelector } from '@vritti/quantum-ui/selects/tax-group';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCategory, useUpdateCategory } from '@/hooks/categories';
import {
  type CategoryData,
  type CategoryFormData,
  CategoryRoleLabels,
  CategoryRoleValues,
  categoryFormResolver,
} from '@/schemas/categories';

const roleOptions = Object.values(CategoryRoleValues).map((value) => ({ value, label: CategoryRoleLabels[value] }));

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
      categoryRole: category?.categoryRole ?? CategoryRoleValues.CATEGORY,
      sortOrder: category?.sortOrder ?? 1,
      isActive: category?.isActive ?? true,
      defaultTaxGroupId: category?.defaultTaxGroupId ?? null,
    },
  });

  const createMutation = useCreateCategory({ onSuccess });
  const updateMutation = useUpdateCategory({ onSuccess });

  const watchedParentId = form.watch('parentId');
  const isLeaf = form.watch('categoryRole') === CategoryRoleValues.CATEGORY;

  const handleSubmit = async (data: CategoryFormData) => {
    const coerced = {
      ...data,
      sortOrder: data.sortOrder,
      parentId: data.parentId || null,
      defaultTaxGroupId: data.defaultTaxGroupId || null,
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
      <Select
        name="categoryRole"
        label="Role"
        options={roleOptions}
        description="A Group holds sub-categories; a Category holds inventory items"
      />
      {isLeaf && (
        <TaxGroupSelector
          name="defaultTaxGroupId"
          label="Default Tax Group"
          placeholder="None (no default tax group)"
          clearable
        />
      )}
      <TextField name="sortOrder" label="Sort Order" type="number" placeholder="1" />
      <Switch
        name="isActive"
        label="Active"
        description="Inactive categories don't appear in item assignment dropdowns"
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText={isEditing ? 'Saving...' : 'Creating...'}>
          {isEditing ? 'Save Changes' : 'Add Category'}
        </Button>
      </DialogActions>
    </Form>
  );
};
