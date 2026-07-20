import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePerson } from '@/hooks/organization/people';
import { PERSON_IDENTIFIER_TYPE_OPTIONS } from '@/schemas/party-identifiers';
import { type CreatePersonFormData, createPersonSchema } from '@/schemas/people';

interface AddPersonDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddPersonDialog: React.FC<AddPersonDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreatePersonFormData>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      identifierType: undefined,
      identifierValue: '',
      isActive: true,
    },
  });

  const createMutation = useCreatePerson({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        identifierType: data.identifierValue ? data.identifierType || undefined : undefined,
        identifierValue: data.identifierValue || undefined,
        isActive: data.isActive,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Details">
          <TextField name="firstName" label="First Name" placeholder="e.g. John" />
          <TextField name="lastName" label="Last Name" placeholder="e.g. Doe" />
          <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
          <TextField name="email" label="Email" type="email" placeholder="e.g. john@acme.com" />
        </FormSection>
        <FormSection
          title="Identity document"
          description="Optionally record an initial identifier — you can add more later."
        >
          <Select
            name="identifierType"
            label="Type"
            placeholder="Select type"
            options={PERSON_IDENTIFIER_TYPE_OPTIONS}
            clearable
          />
          <TextField name="identifierValue" label="Number" placeholder="e.g. ABCDE1234F" />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4">
          <Switch name="isActive" label="Active" description="Inactive people are hidden from selection" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Person
        </Button>
      </DialogActions>
    </Form>
  );
};
