import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CreateAttributeTemplateFormData, createAttributeTemplateSchema } from '@/schemas/attribute-templates';

import type { UseCreateAttributeTemplate } from '../types';

interface AddAttributeTemplateDialogProps {
  useCreateAttributeTemplate: UseCreateAttributeTemplate;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddAttributeTemplateDialog: React.FC<AddAttributeTemplateDialogProps> = ({
  useCreateAttributeTemplate,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateAttributeTemplateFormData>({
    resolver: zodResolver(createAttributeTemplateSchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  const createMutation = useCreateAttributeTemplate({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="flex flex-col gap-4">
        <TextField name="name" label="Template Name" placeholder="e.g. Dietary" />
        <TextField
          name="code"
          label="Code"
          placeholder="e.g. dietary"
          description="Unique across the organization. Lowercase letters, numbers and hyphens."
        />
        <TextField name="description" label="Description" placeholder="e.g. Nutritional claims used across the range" />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Template
        </Button>
      </DialogActions>
    </Form>
  );
};
