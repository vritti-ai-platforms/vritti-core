import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateTaxComponent } from '@/hooks/organization/tax-components';
import {
  authorityLevelOptions,
  type CreateTaxComponentFormData,
  createTaxComponentSchema,
} from '@/schemas/tax-components';
import { TaxComponentSelector } from '@/selectors/tax-component';

interface AddTaxComponentDialogProps {
  countryCode?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddTaxComponentDialog: React.FC<AddTaxComponentDialogProps> = ({ countryCode, onSuccess, onCancel }) => {
  const form = useForm<CreateTaxComponentFormData>({
    resolver: zodResolver(createTaxComponentSchema),
    defaultValues: {
      countryCode,
      code: '',
      name: '',
      authorityLevel: 'FEDERAL',
      isRecoverable: true,
      isWithholding: false,
      isActive: true,
    },
  });

  const selectedCountry = useWatch({ control: form.control, name: 'countryCode' });
  const createMutation = useCreateTaxComponent({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ ...data, standsInForId: data.standsInForId ?? null })}
    >
      <div className="space-y-4">
        <ISOCountrySelect
          name="countryCode"
          description="The country whose tax this is. It can't be changed later."
          onOptionSelect={(option) => {
            if (option?.value !== selectedCountry) form.resetField('standsInForId');
          }}
        />
        <TextField name="code" label="Code" placeholder="e.g. cgst" />
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
          country={selectedCountry}
          clearable
          description="Leave empty for a component charged directly. Pick one when this component replaces it where it has a rate of its own, like UTGST for SGST in a Union Territory."
        />
        <Switch
          name="isRecoverable"
          label="Recoverable"
          description="Recoverable components can be claimed back as input tax credit"
        />
        <Switch name="isWithholding" label="Withholding" description="Withholding components are deducted at source" />
        <Switch
          name="isActive"
          label="Active"
          description="Inactive tax components are hidden from tax group rate forms"
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
