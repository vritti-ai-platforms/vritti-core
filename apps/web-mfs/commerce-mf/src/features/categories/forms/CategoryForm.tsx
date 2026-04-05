import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCategory } from '@/hooks/useCreateCategory';
import { useUpdateCategory } from '@/hooks/useUpdateCategory';
import { type CategoryData, type CategoryFormData, categorySchema } from '@/schemas/categories';

interface CategoryFormProps {
  // Provide to edit an existing category; omit to create a new one
  category?: CategoryData;
  businessUnitId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormFields: React.FC<{ isEditing: boolean; onCancel: () => void }> = ({ isEditing, onCancel }) => (
  <>
    <TextField name="name" label="Name" placeholder="e.g. Electronics" />
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
  </>
);

export const CategoryForm: React.FC<CategoryFormProps> = ({ category, businessUnitId, onSuccess, onCancel }) => {
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      sortOrder: category?.sortOrder ?? 1,
      isActive: category?.isActive ?? true,
    },
  });

  const createMutation = useCreateCategory({ onSuccess });
  const updateMutation = useUpdateCategory({ onSuccess });

  if (isEditing) {
    return (
      <Form
        form={form}
        mutation={updateMutation}
        showRootError
        resetOnSuccess={false}
        onCancel={onCancel}
        transformSubmit={(data) => ({
          id: category.id,
          data: { ...(data as unknown as CategoryFormData), sortOrder: Number(data.sortOrder) },
        })}
      >
        <FormFields isEditing onCancel={onCancel} />
      </Form>
    );
  }

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        ...(data as unknown as CategoryFormData),
        sortOrder: Number(data.sortOrder),
        businessUnitId,
      })}
    >
      <FormFields isEditing={false} onCancel={onCancel} />
    </Form>
  );
};
