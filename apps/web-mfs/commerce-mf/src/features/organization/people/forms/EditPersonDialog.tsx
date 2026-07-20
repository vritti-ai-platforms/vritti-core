import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdatePerson } from '@/hooks/organization/people';
import { type PersonData, type UpdatePersonFormData, updatePersonSchema } from '@/schemas/people';

interface EditPersonDialogProps {
  person: PersonData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditPersonDialog: React.FC<EditPersonDialogProps> = ({ person, onSuccess, onCancel }) => {
  const form = useForm<UpdatePersonFormData>({
    resolver: zodResolver(updatePersonSchema),
    defaultValues: {
      firstName: person.firstName,
      lastName: person.lastName ?? '',
      email: person.email ?? '',
      phone: person.phone ?? '',
      isActive: person.isActive,
    },
  });

  const updateMutation = useUpdatePerson({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: person.id,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          isActive: data.isActive,
        },
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Details">
          <TextField name="firstName" label="First Name" placeholder="e.g. John" />
          <TextField name="lastName" label="Last Name" placeholder="e.g. Doe" />
          <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
          <TextField name="email" label="Email" type="email" placeholder="e.g. john@acme.com" />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4">
          <Switch name="isActive" label="Active" description="Inactive people are hidden from selection" />
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
