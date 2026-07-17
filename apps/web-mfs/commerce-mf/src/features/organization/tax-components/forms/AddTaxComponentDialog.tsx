import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTaxComponent } from '@/hooks/organization/tax-components';
import {
  authorityLevelOptions,
  type CreateTaxComponentFormData,
  createTaxComponentSchema,
} from '@/schemas/tax-components';

interface AddTaxComponentDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddTaxComponentDialog: React.FC<AddTaxComponentDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateTaxComponentFormData>({
    resolver: zodResolver(createTaxComponentSchema),
    defaultValues: {
      code: '',
      name: '',
      authorityLevel: 'FEDERAL',
      isRecoverable: true,
      isWithholding: false,
      isActive: true,
    },
  });

  const createMutation = useCreateTaxComponent({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="space-y-4">
        <TextField name="code" label="Code" placeholder="e.g. cgst" />
        <TextField name="name" label="Name" placeholder="e.g. Central GST" />
        <Select
          name="authorityLevel"
          label="Authority Level"
          placeholder="Select authority level"
          options={authorityLevelOptions}
        />
        <Switch
          name="isRecoverable"
          label="Recoverable"
          description="Recoverable components can be claimed back as input tax credit"
        />
        <Switch
          name="isWithholding"
          label="Withholding"
          description="Withholding components are deducted at source"
        />
        <Switch
          name="isActive"
          label="Active"
          description="Inactive tax components are hidden from rate bundle forms"
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Tax Component
        </Button>
      </DialogActions>
    </Form>
  );
};
