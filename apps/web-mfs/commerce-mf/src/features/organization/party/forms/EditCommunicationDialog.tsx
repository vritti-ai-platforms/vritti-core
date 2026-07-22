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
  type PartyCommunicationRow,
} from '@/schemas/party-communications';
import type { CommunicationsBinding } from '../bindings';
import { AppsEditor } from './AppsEditor';

interface EditCommunicationDialogProps {
  partyId: string;
  binding: CommunicationsBinding;
  communication: PartyCommunicationRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCommunicationDialog: React.FC<EditCommunicationDialogProps> = ({
  partyId,
  binding,
  communication,
  onSuccess,
  onCancel,
}) => {
  const isPhone = communication.channel === 'PHONE';

  const form = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      channel: communication.channel,
      value: communication.value,
      isPrimary: communication.isPrimary,
      isActive: communication.isActive,
      apps: communication.apps.map((a) => ({ app: a.app, handle: a.handle })),
    },
  });

  const updateMutation = binding.useUpdate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        communicationId: communication.id,
        data: {
          value: data.value,
          isPrimary: data.isPrimary,
          isActive: data.isActive,
          apps: (isPhone ? data.apps : []).map((a) => ({ app: a.app, handle: a.handle ?? null })),
        },
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Communication" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            name="channel"
            label="Channel"
            placeholder="Select channel"
            options={COMMUNICATION_CHANNEL_OPTIONS}
            disabled
          />
          <TextField name="value" label="Value" placeholder="e.g. priya@acme.in" />
        </FormSection>
        {isPhone && (
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
