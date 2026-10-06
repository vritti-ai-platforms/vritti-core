import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type AttributeTemplateData,
  type UpdateAttributeTemplateFormData,
  updateAttributeTemplateSchema,
} from '@/schemas/attribute-templates';

import type { UseUpdateAttributeTemplate } from '../types';

interface EditAttributeTemplateDialogProps {
  template: AttributeTemplateData;
  useUpdateAttributeTemplate: UseUpdateAttributeTemplate;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditAttributeTemplateDialog: React.FC<EditAttributeTemplateDialogProps> = ({
  template,
  useUpdateAttributeTemplate,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateAttributeTemplateFormData>({
    resolver: zodResolver(updateAttributeTemplateSchema),
    defaultValues: {
      name: template.name,
      description: template.description ?? '',
    },
  });

  const updateMutation = useUpdateAttributeTemplate({ onSuccess });

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
        <TextField name="name" label="Template Name" placeholder="e.g. Dietary" />
        <TextField name="description" label="Description" placeholder="e.g. Nutritional claims used across the range" />
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
