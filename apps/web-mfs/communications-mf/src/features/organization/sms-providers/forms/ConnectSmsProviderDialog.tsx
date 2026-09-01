import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useCreateSmsProvider } from '@/hooks/organization/sms-providers';
import {
  buildSmsProviderCredentials,
  type ConnectSmsProviderFormData,
  connectSmsProviderSchema,
  SMS_PROVIDER_OPTIONS,
} from '@/schemas/sms-providers';

interface ConnectSmsProviderDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Creates an organization-owned (CLIENT) provider — platform rows come from the cloud admin panel
export const ConnectSmsProviderDialog = ({ onSuccess, onCancel }: ConnectSmsProviderDialogProps) => {
  const form = useForm<ConnectSmsProviderFormData>({
    resolver: zodResolver(connectSmsProviderSchema),
    defaultValues: {
      provider: 'MSG91',
      name: '',
      senderId: '',
      authKey: '',
      accountSid: '',
      authToken: '',
    },
  });

  const createMutation = useCreateSmsProvider({ onSuccess });
  const provider = form.watch('provider');

  return (
    <Form
      form={form}
      mutation={createMutation}
      transformSubmit={(data: ConnectSmsProviderFormData) => ({
        provider: data.provider,
        name: data.name,
        ...(data.senderId?.trim() ? { senderId: data.senderId.trim() } : {}),
        ...(buildSmsProviderCredentials(data.provider, data)
          ? { credentials: buildSmsProviderCredentials(data.provider, data) }
          : {}),
      })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <Select name="provider" label="Provider" options={SMS_PROVIDER_OPTIONS} />
        <TextField
          name="name"
          label="Name"
          placeholder="e.g. CampX MSG91"
          description="How this provider appears in Vritti"
        />
        <TextField
          name="senderId"
          label="Sender ID"
          placeholder="e.g. CAMPXI"
          description="Default originator — an app's OTP config can override it"
        />

        {provider === 'MSG91' && (
          <TextField
            name="authKey"
            label="Auth key"
            type="password"
            description="MSG91 account auth key. Stored server-side and never returned."
          />
        )}
        {provider === 'TWILIO' && (
          <>
            <TextField name="accountSid" label="Account SID" placeholder="ACxxxxxxxx" />
            <TextField
              name="authToken"
              label="Auth token"
              type="password"
              description="Stored server-side and never returned."
            />
          </>
        )}
        {provider === 'CONSOLE' && (
          <Typography variant="body2" intent="muted">
            No credentials needed — codes are logged to the server console. For development only.
          </Typography>
        )}
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Connecting...">
          Connect provider
        </Button>
      </DialogActions>
    </Form>
  );
};
