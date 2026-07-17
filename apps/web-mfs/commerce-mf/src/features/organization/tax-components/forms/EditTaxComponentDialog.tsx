import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateTaxComponent } from '@/hooks/organization/tax-components';
import {
  authorityLevelOptions,
  type TaxComponentData,
  type UpdateTaxComponentFormData,
  updateTaxComponentSchema,
} from '@/schemas/tax-components';

interface EditTaxComponentDialogProps {
  taxComponent: TaxComponentData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditTaxComponentDialog: React.FC<EditTaxComponentDialogProps> = ({
  taxComponent,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateTaxComponentFormData>({
    resolver: zodResolver(updateTaxComponentSchema),
    defaultValues: {
      name: taxComponent.name,
      authorityLevel: taxComponent.authorityLevel,
      isRecoverable: taxComponent.isRecoverable,
      isWithholding: taxComponent.isWithholding,
      isActive: taxComponent.isActive,
    },
  });

  const updateMutation = useUpdateTaxComponent({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: taxComponent.id,
        data: {
          name: data.name,
          authorityLevel: data.authorityLevel,
          isRecoverable: data.isRecoverable,
          isWithholding: data.isWithholding,
          isActive: data.isActive,
        },
      })}
    >
      <div className="space-y-4">
        <TextField name="code" label="Code" value={taxComponent.code} disabled description="Code cannot be changed" />
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
