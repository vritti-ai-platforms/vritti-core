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
import { useUpdateCompanyRegistration } from '@/hooks/organization/companies';
import {
  type CompanyRegistrationFormData,
  type CompanyTaxRegistrationRow,
  companyRegistrationSchema,
  REGISTRATION_TYPE_OPTIONS,
} from '@/schemas/companies';

interface EditRegistrationDialogProps {
  companyId: string;
  registration: CompanyTaxRegistrationRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditRegistrationDialog: React.FC<EditRegistrationDialogProps> = ({
  companyId,
  registration,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CompanyRegistrationFormData>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: {
      jurisdictionId: registration.jurisdictionId,
      registrationNumber: registration.registrationNumber,
      registrationType: registration.registrationType,
      isPrimary: registration.isPrimary,
    },
  });

  const updateMutation = useUpdateCompanyRegistration(companyId, { onSuccess });

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
