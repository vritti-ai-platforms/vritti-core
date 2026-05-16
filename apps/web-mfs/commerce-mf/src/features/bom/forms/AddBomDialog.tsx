import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateBom } from '@/hooks/bom';
import { type CreateBomFormData, createBomSchema } from '@/schemas/bom';

interface AddBomDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddBomDialog: React.FC<AddBomDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateBomFormData>({
    resolver: zodResolver(createBomSchema),
    defaultValues: {
      name: '',
      code: '',
      isActive: true,
    },
  });

  const createMutation = useCreateBom({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        name: data.name,
        code: data.code,
        isActive: data.isActive,
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Chicken Biryani Full" />
      <TextField name="code" label="Code" placeholder="e.g. BOM-BIR-CHK-F" />
      <Switch name="isActive" label="Active" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add BOM
        </Button>
      </div>
    </Form>
  );
};
