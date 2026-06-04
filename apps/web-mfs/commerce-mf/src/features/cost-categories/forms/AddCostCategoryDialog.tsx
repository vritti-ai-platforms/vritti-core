import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCostCategory } from '@/hooks/cost-categories';
import {
  COST_CATEGORY_KIND_OPTIONS,
  type CreateCostCategoryFormData,
  createCostCategorySchema,
} from '@/schemas/cost-categories';

interface AddCostCategoryDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCostCategoryDialog: React.FC<AddCostCategoryDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateCostCategoryFormData>({
    resolver: zodResolver(createCostCategorySchema),
    defaultValues: {
      code: '',
      name: '',
      kind: 'OTHER',
    },
  });

  const createMutation = useCreateCostCategory({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="space-y-4">
        <TextField
          name="code"
          label="Code"
          placeholder="e.g. SUPPLIER_PRICE"
          description="Uppercase letters, digits, and underscores"
        />
        <TextField name="name" label="Name" placeholder="e.g. Supplier Price" />
        <Select
          name="kind"
          label="Kind"
          placeholder="Select kind"
          options={COST_CATEGORY_KIND_OPTIONS}
          description="Reporting bucket — fixed list across all orgs"
        />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Cost Category
        </Button>
      </div>
    </Form>
  );
};
