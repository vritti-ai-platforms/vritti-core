import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { CONTACT_PURPOSE_OPTIONS, type PartyContactFormData, partyContactSchema } from '@/schemas/party-contacts';
import type { ContactsBinding } from '../bindings';

interface AddContactDialogProps {
  partyId: string;
  binding: ContactsBinding;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddContactDialog: React.FC<AddContactDialogProps> = ({ partyId, binding, onSuccess, onCancel }) => {
  const form = useForm<PartyContactFormData>({
    resolver: zodResolver(partyContactSchema),
    defaultValues: {
      purpose: 'ORDER',
      label: '',
      name: '',
      email: '',
      phone: '',
      isPrimary: false,
      isActive: true,
    },
  });

  const createMutation = binding.useCreate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        purpose: data.purpose,
        label: data.label,
        name: data.name,
        email: data.email,
        phone: data.phone,
        isPrimary: data.isPrimary,
        isActive: data.isActive,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Contact">
          <Select name="purpose" label="Purpose" placeholder="Select purpose" options={CONTACT_PURPOSE_OPTIONS} />
          <TextField name="label" label="Label" placeholder="e.g. Front desk" />
          <TextField name="name" label="Name" placeholder="e.g. Priya Sharma" />
          <TextField name="email" label="Email" placeholder="e.g. orders@acme.com" />
          <TextField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Switch name="isPrimary" label="Primary contact" description="Default contact for this purpose" />
          <Switch name="isActive" label="Active" description="Inactive contacts are hidden from pickers" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Contact
        </Button>
      </DialogActions>
    </Form>
  );
};
