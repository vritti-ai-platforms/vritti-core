import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateCostCategory } from '@/le/hooks/cost-categories';
import {
  type CostCategoryData,
  type UpdateCostCategoryFormData,
  updateCostCategorySchema,
} from '@/schemas/cost-categories';

interface EditCostCategoryDialogProps {
  category: CostCategoryData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCostCategoryDialog: React.FC<EditCostCategoryDialogProps> = ({ category, onSuccess, onCancel }) => {
  const form = useForm<UpdateCostCategoryFormData>({
    resolver: zodResolver(updateCostCategorySchema),
    defaultValues: {
      name: category.name,
    },
  });

  const updateMutation = useUpdateCostCategory({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: category.id, data: { name: data.name } })}
    >
      <div className="space-y-4">
        <TextField name="code" label="Code" value={category.code} disabled description="Code cannot be changed" />
        <TextField name="kind" label="Kind" value={category.kind} disabled description="Kind cannot be changed" />
        <TextField name="name" label="Name" placeholder="e.g. Supplier Price" />
      </div>
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
