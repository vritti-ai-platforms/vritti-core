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
import { useUpdateCategory } from '@/hooks/organization/categories';
import {
  type CategoryData,
  type CategoryFormData,
  CategoryRoleLabels,
  CategoryRoleValues,
  categoryFormResolver,
} from '@/schemas/categories';

const roleOptions = Object.values(CategoryRoleValues).map((value) => ({ value, label: CategoryRoleLabels[value] }));

interface EditCategoryDialogProps {
  category: CategoryData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({ category, onSuccess, onCancel }) => {
  const form = useForm<CategoryFormData>({
    resolver: categoryFormResolver,
    defaultValues: {
      name: category.name,
      parentId: category.parentId ?? null,
      categoryRole: category.categoryRole,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      defaultTaxGroupId: category.defaultTaxGroupId ?? null,
    },
  });

  const updateMutation = useUpdateCategory({ onSuccess });

  const watchedParentId = form.watch('parentId');
  const isLeaf = form.watch('categoryRole') === CategoryRoleValues.CATEGORY;

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data: CategoryFormData) => ({
        id: category.id,
        data: { ...data, parentId: data.parentId || null, defaultTaxGroupId: data.defaultTaxGroupId || null },
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Electronics" />
      <CategorySelector
        label="Parent Category"
        name="parentId"
        placeholder="None (root category)"
        value={watchedParentId ?? undefined}
        params={{ role: 'GROUP', excludeIds: [category.id, category.parentId].filter(Boolean).join(',') }}
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
