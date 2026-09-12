import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateTaxRegistration } from '@/hooks/legal-entity/tax-registrations';
import {
  type CreateTaxRegistrationFormData,
  createTaxRegistrationSchema,
  REGISTRATION_TYPES,
  type TaxRegistrationData,
} from '@/schemas/tax-registrations';

const TYPE_OPTIONS = REGISTRATION_TYPES.map((type) => ({ value: type, label: type }));

interface EditTaxRegistrationDialogProps {
  registration: TaxRegistrationData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditTaxRegistrationDialog: React.FC<EditTaxRegistrationDialogProps> = ({
  registration,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateTaxRegistrationFormData>({
    resolver: zodResolver(createTaxRegistrationSchema),
    defaultValues: {
      jurisdictionId: registration.jurisdictionId,
      registrationNumber: registration.registrationNumber,
      registrationType: registration.registrationType,
      isPrimary: registration.isPrimary,
    },
  });

  const updateMutation = useUpdateTaxRegistration({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: registration.id, data })}
    >
      <div className="flex flex-col gap-4">
        <Select
          name="jurisdictionId"
          label="Registered in"
          placeholder="Select a jurisdiction"
          optionsEndpoint="commerce-api/select-api/tax-jurisdictions"
          fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
          searchable
          description="Where the number was issued — it decides the origin for tax on every sale."
        />
        <Select name="registrationType" label="Type" options={TYPE_OPTIONS} />
        <TextField
          name="registrationNumber"
          label="Registration Number"
          placeholder="e.g. 36BPNPL2271K2ZH"
          description="As issued — the first two digits of a GSTIN are its state code."
        />
        <Switch
          name="isPrimary"
          label="Primary registration"
          description="The one this company files under by default. Setting it clears the flag on the others."
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
