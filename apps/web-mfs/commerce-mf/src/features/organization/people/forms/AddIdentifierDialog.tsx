import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddPersonIdentifier } from '@/hooks/organization/people';
import {
  type AddIdentifierFormData,
  addIdentifierSchema,
  PERSON_IDENTIFIER_TYPE_OPTIONS,
} from '@/schemas/party-identifiers';

interface AddIdentifierDialogProps {
  partyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddIdentifierDialog: React.FC<AddIdentifierDialogProps> = ({ partyId, onSuccess, onCancel }) => {
  const form = useForm<AddIdentifierFormData>({
    resolver: zodResolver(addIdentifierSchema),
    defaultValues: {
      idType: 'PAN',
      idValue: '',
      isPrimary: false,
    },
  });

  const createMutation = useAddPersonIdentifier(partyId, { onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="flex flex-col gap-6">
        <FormSection title="Identity document">
          <Select name="idType" label="Type" placeholder="Select type" options={PERSON_IDENTIFIER_TYPE_OPTIONS} />
          <TextField name="idValue" label="Number" placeholder="e.g. ABCDE1234F" />
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
