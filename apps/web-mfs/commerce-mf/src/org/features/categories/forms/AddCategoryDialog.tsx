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
import { useCreateCategory } from '@/org/hooks/categories';
import {
  type CategoryFormData,
  CategoryRoleLabels,
  CategoryRoleValues,
  categoryFormResolver,
} from '@/schemas/categories';

const roleOptions = Object.values(CategoryRoleValues).map((value) => ({ value, label: CategoryRoleLabels[value] }));

interface AddCategoryDialogProps {
  defaultParentId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({
  defaultParentId = null,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CategoryFormData>({
    resolver: categoryFormResolver,
    defaultValues: {
      name: '',
      parentId: defaultParentId,
      categoryRole: CategoryRoleValues.CATEGORY,
      sortOrder: 1,
      isActive: true,
      defaultTaxGroupId: null,
    },
  });

  const createMutation = useCreateCategory({ onSuccess });

  const watchedParentId = form.watch('parentId');
  const isLeaf = form.watch('categoryRole') === CategoryRoleValues.CATEGORY;

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data: CategoryFormData) => ({
        ...data,
        parentId: data.parentId || null,
        defaultTaxGroupId: data.defaultTaxGroupId || null,
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Electronics" />
      <CategorySelector
        label="Parent Category"
        name="parentId"
        placeholder="None (root category)"
        value={watchedParentId ?? undefined}
        disabled={!!defaultParentId}
        params={{ role: 'GROUP' }}
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
        <Button type="submit" loadingText="Creating...">
          Add Category
        </Button>
      </DialogActions>
    </Form>
  );
};
