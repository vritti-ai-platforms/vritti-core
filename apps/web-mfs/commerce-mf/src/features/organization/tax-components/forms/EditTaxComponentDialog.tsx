import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateTaxComponent } from '@/hooks/organization/tax-components';
import {
  authorityLevelOptions,
  type EditTaxComponentFormData,
  editTaxComponentFormSchema,
  type TaxComponentData,
} from '@/schemas/tax-components';
import { TaxComponentSelector } from '@/selectors/tax-component';

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
  const form = useForm<EditTaxComponentFormData>({
    resolver: zodResolver(editTaxComponentFormSchema),
    defaultValues: {
      countryCode: taxComponent.countryCode,
      code: taxComponent.code,
      name: taxComponent.name,
      authorityLevel: taxComponent.authorityLevel,
      standsInForId: taxComponent.standsInForId ?? undefined,
      isRecoverable: taxComponent.isRecoverable,
      isWithholding: taxComponent.isWithholding,
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
          standsInForId: data.standsInForId ?? null,
          isRecoverable: data.isRecoverable,
          isWithholding: data.isWithholding,
        },
      })}
    >
      <div className="space-y-4">
        <ISOCountrySelect name="countryCode" disabled description="Country cannot be changed" />
        <TextField name="code" label="Code" disabled description="Code cannot be changed" />
        <TextField name="name" label="Name" placeholder="e.g. Central GST" />
        <Select
          name="authorityLevel"
          label="Authority Level"
          placeholder="Select authority level"
          options={authorityLevelOptions}
        />
        <TaxComponentSelector
          name="standsInForId"
          label="Stands In For (optional)"
          country={taxComponent.countryCode}
          clearable
          description="Leave empty for a component charged directly. Pick one when this component replaces it where it has a rate of its own, like UTGST for SGST in a Union Territory."
        />
        <Switch
          name="isRecoverable"
          label="Recoverable"
          description="Recoverable components can be claimed back as input tax credit"
        />
        <Switch name="isWithholding" label="Withholding" description="Withholding components are deducted at source" />
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
