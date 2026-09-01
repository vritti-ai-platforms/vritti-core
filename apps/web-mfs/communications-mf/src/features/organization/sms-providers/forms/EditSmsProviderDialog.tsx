import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useUpdateSmsProvider } from '@/hooks/organization/sms-providers';
import {
  buildSmsProviderCredentials,
  type SmsProviderData,
  type UpdateSmsProviderFormData,
  updateSmsProviderSchema,
} from '@/schemas/sms-providers';

interface EditSmsProviderDialogProps {
  provider: SmsProviderData;
  onSuccess: () => void;
  onCancel: () => void;
}

// The provider code is immutable — switching vendors is a new row. Blank credential fields keep
// the stored secrets in place; filled ones replace them wholesale.
export const EditSmsProviderDialog = ({ provider, onSuccess, onCancel }: EditSmsProviderDialogProps) => {
  const form = useForm<UpdateSmsProviderFormData>({
    resolver: zodResolver(updateSmsProviderSchema),
    defaultValues: {
      name: provider.name,
      senderId: provider.senderId ?? '',
      authKey: '',
      accountSid: '',
      authToken: '',
    },
  });

  const updateMutation = useUpdateSmsProvider({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      transformSubmit={(data: UpdateSmsProviderFormData) => ({
        id: provider.id,
        data: {
          name: data.name,
          senderId: data.senderId?.trim() ?? '',
          ...(buildSmsProviderCredentials(provider.provider, data)
            ? { credentials: buildSmsProviderCredentials(provider.provider, data) }
            : {}),
        },
      })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <TextField name="name" label="Name" />
        <TextField
          name="senderId"
          label="Sender ID"
          description="Default originator — an app's OTP config can override it"
        />

        {provider.provider === 'MSG91' && (
          <TextField
            name="authKey"
            label="New auth key"
            type="password"
            description="Leave blank to keep the stored key"
          />
        )}
        {provider.provider === 'TWILIO' && (
          <>
            <TextField name="accountSid" label="New Account SID" description="Leave blank to keep the stored SID" />
            <TextField
              name="authToken"
              label="New auth token"
              type="password"
              description="Both fields are required together to replace the stored credentials"
            />
          </>
        )}
        {provider.provider === 'CONSOLE' && (
          <Typography variant="body2" intent="muted">
            The console provider has no credentials.
          </Typography>
        )}
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save changes
        </Button>
      </DialogActions>
    </Form>
  );
};
