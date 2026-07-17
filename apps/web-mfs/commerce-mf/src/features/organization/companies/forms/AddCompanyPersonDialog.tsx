import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PersonSelector } from '@vritti/quantum-ui/PersonSelector';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddCompanyPerson } from '@/hooks/organization/companies';
import { type AddCompanyPersonFormData, addCompanyPersonSchema } from '@/schemas/companies';

interface AddCompanyPersonDialogProps {
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCompanyPersonDialog: React.FC<AddCompanyPersonDialogProps> = ({ companyId, onSuccess, onCancel }) => {
  const form = useForm<AddCompanyPersonFormData>({
    resolver: zodResolver(addCompanyPersonSchema),
    defaultValues: {
      personId: '',
      jobTitle: '',
      secondaryPhone: '',
      secondaryEmail: '',
      isPrimary: false,
    },
  });

  const addMutation = useAddCompanyPerson(companyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        childPartyId: data.personId,
        jobTitle: data.jobTitle || undefined,
        secondaryPhone: data.secondaryPhone || undefined,
        secondaryEmail: data.secondaryEmail || undefined,
        isPrimary: data.isPrimary,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Person" contentClassName="grid grid-cols-1 gap-4">
          <PersonSelector name="personId" />
        </FormSection>
        <FormSection title="Role & contact">
          <TextField name="jobTitle" label="Job Title" placeholder="e.g. Procurement Manager" />
          <PhoneField name="secondaryPhone" label="Secondary Phone" placeholder="e.g. +91 98765 00000" />
          <TextField name="secondaryEmail" label="Secondary Email" type="email" placeholder="e.g. contact@acme.com" />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4">
          <Switch name="isPrimary" label="Primary person" description="Used as the default person for this company" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Person
        </Button>
      </DialogActions>
    </Form>
  );
};
