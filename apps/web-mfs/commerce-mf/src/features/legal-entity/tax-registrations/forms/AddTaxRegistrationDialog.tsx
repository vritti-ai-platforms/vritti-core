import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTaxRegistration } from '@/hooks/legal-entity/tax-registrations';
import {
  type CreateTaxRegistrationFormData,
  createTaxRegistrationSchema,
  REGISTRATION_TYPES,
} from '@/schemas/tax-registrations';

const TYPE_OPTIONS = REGISTRATION_TYPES.map((type) => ({ value: type, label: type }));

interface AddTaxRegistrationDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddTaxRegistrationDialog: React.FC<AddTaxRegistrationDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateTaxRegistrationFormData>({
    resolver: zodResolver(createTaxRegistrationSchema),
    defaultValues: { jurisdictionId: '', registrationNumber: '', registrationType: 'GSTIN', isPrimary: false },
  });

  const createMutation = useCreateTaxRegistration({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} onCancel={onCancel}>
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
        <Button type="submit" loadingText="Adding...">
          Add Registration
        </Button>
      </DialogActions>
    </Form>
  );
};
