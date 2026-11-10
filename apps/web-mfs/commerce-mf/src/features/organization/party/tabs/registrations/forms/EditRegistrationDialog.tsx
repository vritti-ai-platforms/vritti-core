import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  type PartyRegistrationFormData,
  type PartyTaxRegistrationRow,
  partyRegistrationSchema,
  REGISTRATION_SCHEME_OPTIONS,
  REGISTRATION_TYPE_OPTIONS,
} from '@/schemas/party-registrations';
import { JurisdictionSelector } from '@/selectors/jurisdiction';
import type { RegistrationsBinding } from '../../../bindings';

interface EditRegistrationDialogProps {
  partyId: string;
  binding: RegistrationsBinding;
  registration: PartyTaxRegistrationRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditRegistrationDialog: React.FC<EditRegistrationDialogProps> = ({
  partyId,
  binding,
  registration,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<PartyRegistrationFormData>({
    resolver: zodResolver(partyRegistrationSchema),
    defaultValues: {
      countryCode: registration.countryCode,
      jurisdictionId: registration.jurisdictionId,
      registrationNumber: registration.registrationNumber,
      registrationType: registration.registrationType,
      scheme: registration.scheme,
      isPrimary: registration.isPrimary,
    },
  });
  const countryCode = useWatch({ control: form.control, name: 'countryCode' });

  const updateMutation = binding.useUpdate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data: PartyRegistrationFormData) => ({
        registrationId: registration.id,
        data: { ...data, jurisdictionId: data.jurisdictionId ?? null },
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Tax registration">
          <ISOCountrySelect
            name="countryCode"
            onOptionSelect={(option) => {
              // The state belongs to the old country; null replaces the default so it cannot come back
              if (option?.value !== countryCode) form.resetField('jurisdictionId', { defaultValue: null });
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
