import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateUomDimension } from '@/hooks/uom-dimensions';
import { type CreateUomDimensionFormData, createUomDimensionResolver } from '@/schemas/uom-dimensions';

interface AddUomDimensionDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddUomDimensionDialog: React.FC<AddUomDimensionDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateUomDimensionFormData>({
    resolver: createUomDimensionResolver,
    defaultValues: { code: '', name: '', description: '' },
  });

  const createMutation = useCreateUomDimension({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description?.trim() ? data.description : undefined,
      })}
    >
      <TextField name="code" label="Code" placeholder="e.g. WEIGHT" />
      <TextField name="name" label="Name" placeholder="e.g. Weight" />
      <TextArea name="description" label="Description" placeholder="Optional description" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Dimension
        </Button>
      </div>
    </Form>
  );
};
