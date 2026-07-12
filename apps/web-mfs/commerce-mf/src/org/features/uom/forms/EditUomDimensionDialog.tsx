import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateUomDimension } from '@/org/hooks/uom-dimensions';
import {
  type UomDimensionData,
  type UpdateUomDimensionFormData,
  updateUomDimensionResolver,
} from '@/schemas/uom-dimensions';

interface EditUomDimensionDialogProps {
  dimension: UomDimensionData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditUomDimensionDialog: React.FC<EditUomDimensionDialogProps> = ({ dimension, onSuccess, onCancel }) => {
  const form = useForm<UpdateUomDimensionFormData>({
    resolver: updateUomDimensionResolver,
    defaultValues: {
      code: dimension.code,
      name: dimension.name,
      description: dimension.description ?? '',
    },
  });

  const updateMutation = useUpdateUomDimension({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: dimension.id,
        data: {
          code: data.code,
          name: data.name,
          description: data.description?.trim() ? data.description : undefined,
        },
      })}
    >
      <TextField name="code" label="Code" placeholder="e.g. weight" />
      <TextField name="name" label="Name" placeholder="e.g. Weight" />
      <TextArea name="description" label="Description" placeholder="Optional description" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
