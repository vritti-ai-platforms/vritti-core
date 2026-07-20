import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateUomDimension } from '@/hooks/organization/uom-dimensions';
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
        code: data.code,
        name: data.name,
        description: data.description,
      })}
    >
      <TextField name="code" label="Code" placeholder="e.g. weight" />
      <TextField name="name" label="Name" placeholder="e.g. Weight" />
      <TextArea name="description" label="Description" placeholder="Optional description" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Dimension
        </Button>
      </DialogActions>
    </Form>
  );
};
