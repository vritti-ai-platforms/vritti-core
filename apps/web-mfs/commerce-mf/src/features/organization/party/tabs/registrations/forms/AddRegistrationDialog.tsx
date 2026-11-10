import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useOrgCountryCode } from '@vritti/quantum-ui/hooks';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type PartyRegistrationFormData,
  partyRegistrationSchema,
  REGISTRATION_SCHEME_OPTIONS,
  REGISTRATION_TYPE_OPTIONS,
} from '@/schemas/party-registrations';
import { JurisdictionSelector } from '@/selectors/jurisdiction';
import type { RegistrationsBinding } from '../../../bindings';

interface AddRegistrationDialogProps {
  partyId: string;
  binding: RegistrationsBinding;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddRegistrationDialog: React.FC<AddRegistrationDialogProps> = ({
  partyId,
  binding,
  onSuccess,
  onCancel,
}) => {
  const orgCountryCode = useOrgCountryCode();
  const form = useForm<PartyRegistrationFormData>({
    resolver: zodResolver(partyRegistrationSchema),
    defaultValues: {
      registrationNumber: '',
      countryCode: orgCountryCode,
      registrationType: 'GSTIN',
      scheme: 'REGULAR',
      isPrimary: false,
    },
  });
  const countryCode = useWatch({ control: form.control, name: 'countryCode' });

  const createMutation = binding.useCreate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data: PartyRegistrationFormData) => ({ ...data, jurisdictionId: data.jurisdictionId ?? null })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Tax registration">
          <ISOCountrySelect
            name="countryCode"
            onOptionSelect={(option) => {
              if (option?.value !== countryCode) form.resetField('jurisdictionId');
            }}
          />
          <JurisdictionSelector
            name="jurisdictionId"
            label="State"
            country={countryCode}
            clearable
            description="Required for a GSTIN; empty for a national registration"
          />
          <TextField name="registrationNumber" label="Registration Number" placeholder="e.g. 29AABCT1332L1ZP" />
          <Select
            name="registrationType"
            label="Registration Type"
            placeholder="Select type"
            options={REGISTRATION_TYPE_OPTIONS}
          />
          <Select
            name="scheme"
            label="Scheme"
            placeholder="Select scheme"
            options={REGISTRATION_SCHEME_OPTIONS}
            description="How the party is registered — regular, composition or a special economic zone"
          />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4">
          <Switch name="isPrimary" label="Primary registration" description="Used as the default for this country" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Registration
        </Button>
      </DialogActions>
    </Form>
  );
};
