import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CreateDimensionTemplateFormData, createDimensionTemplateSchema } from '@/schemas/dimension-templates';

import type { UseCreateDimensionTemplate } from '../types';

interface AddDimensionTemplateDialogProps {
  useCreateDimensionTemplate: UseCreateDimensionTemplate;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddDimensionTemplateDialog: React.FC<AddDimensionTemplateDialogProps> = ({
  useCreateDimensionTemplate,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateDimensionTemplateFormData>({
    resolver: zodResolver(createDimensionTemplateSchema),
    defaultValues: { code: '', name: '', description: '' },
  });

  const createMutation = useCreateDimensionTemplate({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="flex flex-col gap-4">
        <TextField name="name" label="Template Name" placeholder="e.g. Apparel Size" />
        <TextField
          name="code"
          label="Code"
          placeholder="e.g. apparel-size"
          description="Unique across the organization. Lowercase letters, numbers and hyphens."
        />
        <TextField name="description" label="Description" placeholder="e.g. Sizes used across apparel" />
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
