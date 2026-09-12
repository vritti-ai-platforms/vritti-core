import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateDimensionTemplate } from '@/hooks/organization/dimension-templates';
import {
  type DimensionTemplateData,
  type UpdateDimensionTemplateFormData,
  updateDimensionTemplateSchema,
} from '@/schemas/dimension-templates';

interface EditDimensionTemplateDialogProps {
  template: DimensionTemplateData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditDimensionTemplateDialog: React.FC<EditDimensionTemplateDialogProps> = ({
  template,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateDimensionTemplateFormData>({
    resolver: zodResolver(updateDimensionTemplateSchema),
    defaultValues: {
      name: template.name,
      description: template.description ?? '',
    },
  });

  const updateMutation = useUpdateDimensionTemplate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: template.id,
        data: {
          name: data.name,
          description: data.description,
        },
      })}
    >
      <div className="flex flex-col gap-4">
        <TextField name="name" label="Template Name" placeholder="e.g. Apparel Size" />
        <TextField name="description" label="Description" placeholder="e.g. Sizes used across apparel" />
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
