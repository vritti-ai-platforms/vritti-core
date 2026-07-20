import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type AddIdentifierFormData, addIdentifierSchema } from '@/schemas/party-identifiers';
import type { IdentifiersBinding } from '../bindings';

interface AddIdentifierDialogProps {
  partyId: string;
  binding: IdentifiersBinding;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddIdentifierDialog: React.FC<AddIdentifierDialogProps> = ({ partyId, binding, onSuccess, onCancel }) => {
  const form = useForm<AddIdentifierFormData>({
    resolver: zodResolver(addIdentifierSchema),
    defaultValues: {
      idType: binding.defaultType,
      idValue: '',
      isPrimary: false,
    },
  });

  const createMutation = binding.useCreate(partyId, { onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="flex flex-col gap-6">
        <FormSection title="Identity document">
          <Select name="idType" label="Type" placeholder="Select type" options={binding.typeOptions} />
          <TextField name="idValue" label="Number" placeholder={binding.valuePlaceholder} />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4">
          <Switch name="isPrimary" label="Primary identifier" description="Used as the default for this type" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Identifier
        </Button>
      </DialogActions>
    </Form>
  );
};
