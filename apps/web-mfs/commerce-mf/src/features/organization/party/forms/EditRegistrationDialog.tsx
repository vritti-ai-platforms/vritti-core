import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { JurisdictionSelector } from '@/components/JurisdictionSelector';
import {
  type PartyRegistrationFormData,
  type PartyTaxRegistrationRow,
  partyRegistrationSchema,
  REGISTRATION_TYPE_OPTIONS,
} from '@/schemas/party-registrations';
import type { RegistrationsBinding } from '../bindings';

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
      jurisdictionId: registration.jurisdictionId,
      registrationNumber: registration.registrationNumber,
      registrationType: registration.registrationType,
      isPrimary: registration.isPrimary,
    },
  });

  const updateMutation = binding.useUpdate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ registrationId: registration.id, data })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Tax registration">
          <JurisdictionSelector name="jurisdictionId" className="col-span-2" />
          <TextField name="registrationNumber" label="Registration Number" placeholder="e.g. 29AABCT1332L1ZP" />
          <Select
            name="registrationType"
            label="Registration Type"
            placeholder="Select type"
            options={REGISTRATION_TYPE_OPTIONS}
          />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4">
          <Switch
            name="isPrimary"
            label="Primary registration"
            description="Used as the default for this jurisdiction"
          />
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
