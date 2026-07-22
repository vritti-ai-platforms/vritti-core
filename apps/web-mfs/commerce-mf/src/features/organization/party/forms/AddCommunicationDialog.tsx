import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  COMMUNICATION_CHANNEL_OPTIONS,
  type CommunicationFormData,
  communicationSchema,
  MESSAGING_APP_OPTIONS,
} from '@/schemas/party-communications';
import type { CommunicationsBinding } from '../bindings';
import { AppsEditor } from './AppsEditor';

interface AddCommunicationDialogProps {
  partyId: string;
  binding: CommunicationsBinding;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCommunicationDialog: React.FC<AddCommunicationDialogProps> = ({
  partyId,
  binding,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      channel: 'EMAIL',
      value: '',
      isPrimary: false,
      isActive: true,
      apps: [],
    },
  });

  const channel = form.watch('channel');
  const createMutation = binding.useCreate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        channel: data.channel,
        value: data.value,
        isPrimary: data.isPrimary,
        isActive: data.isActive,
        apps: (data.channel === 'PHONE' ? data.apps : []).map((a) => ({ app: a.app, handle: a.handle ?? null })),
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Communication" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select name="channel" label="Channel" placeholder="Select channel" options={COMMUNICATION_CHANNEL_OPTIONS} />
          <TextField name="value" label="Value" placeholder="e.g. priya@acme.in" />
        </FormSection>
        {channel === 'PHONE' && (
          <FormSection title="Messaging Apps" contentClassName="block">
            <AppsEditor
              name="apps"
              description="Which apps is this number reachable on? Add a handle only if it differs from the number."
              options={MESSAGING_APP_OPTIONS}
            />
          </FormSection>
        )}
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Switch name="isPrimary" label="Primary" description="Default value for its channel" />
          <Switch name="isActive" label="Active" description="Inactive values are hidden from pickers" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Communication
        </Button>
      </DialogActions>
    </Form>
  );
};
