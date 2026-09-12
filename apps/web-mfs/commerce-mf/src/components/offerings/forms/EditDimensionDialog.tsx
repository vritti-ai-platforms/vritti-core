import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type OfferingDimensionData, type UpdateDimensionFormData, updateDimensionSchema } from '@/schemas/offerings';
import type { UseUpdateDimension } from '../types';

interface EditDimensionDialogProps {
  useUpdate: UseUpdateDimension;
  dimension: OfferingDimensionData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditDimensionDialog: React.FC<EditDimensionDialogProps> = ({
  useUpdate,
  dimension,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateDimensionFormData>({
    resolver: zodResolver(updateDimensionSchema),
    defaultValues: { name: dimension.name, description: dimension.description ?? '' },
  });

  const updateMutation = useUpdate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: dimension.id, name: data.name, description: data.description })}
    >
      <div className="flex flex-col gap-4">
        <TextField
          name="name"
          label="Name"
          description={`The code stays "${dimension.code}" — it is a segment of every SKU derived from this dimension.`}
        />
        <TextField name="description" label="Description" placeholder="e.g. Pack sizes offered on this line" />
      </div>

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
