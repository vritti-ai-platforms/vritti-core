import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useAvailableSmsProviders, useCreateSmsProvider } from '@/hooks/organization/sms-providers';
import {
  buildSmsProviderCredentials,
  type ConnectSmsProviderFormData,
  connectSmsProviderSchema,
  SMS_PROVIDER_LABELS,
  type SmsProviderCapabilities,
} from '@/schemas/sms-providers';

interface ConnectSmsProviderDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Creates an organization-owned (CLIENT) provider — platform rows come from the cloud admin panel.
 *
 * The choices come from the server's transport registry, not a constant here, so a provider with no
 * implementation behind it is never offered. Only the credential fields stay per-provider, because
 * the credential shape genuinely is.
 */
export const ConnectSmsProviderDialog = ({ onSuccess, onCancel }: ConnectSmsProviderDialogProps) => {
  const { data: providers, isLoading } = useAvailableSmsProviders();

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!providers?.length) {
    return (
      <Alert
        variant="warning"
        title="No SMS providers available"
        description="This deployment has no SMS provider implementations enabled, so there is nothing to connect."
      />
    );
  }

  // The form is split out so it can seed its default from the loaded list rather than a hardcoded code
  return <ConnectForm providers={providers} onSuccess={onSuccess} onCancel={onCancel} />;
};

interface ConnectFormProps extends ConnectSmsProviderDialogProps {
  providers: SmsProviderCapabilities[];
}

const ConnectForm = ({ providers, onSuccess, onCancel }: ConnectFormProps) => {
  const form = useForm<ConnectSmsProviderFormData>({
    resolver: zodResolver(connectSmsProviderSchema),
    defaultValues: {
      provider: providers[0].code,
      name: '',
      senderId: '',
      authKey: '',
      accountSid: '',
      authToken: '',
    },
  });

  const createMutation = useCreateSmsProvider({ onSuccess });
  const selectedCode = form.watch('provider');
  const selected = providers.find((candidate) => candidate.code === selectedCode);

  const options = useMemo(
    () =>
      providers.map((candidate) => ({
        value: candidate.code,
        label: SMS_PROVIDER_LABELS[candidate.code]?.label ?? candidate.code,
        description: SMS_PROVIDER_LABELS[candidate.code]?.description,
      })),
    [providers],
  );

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
        <Select name="provider" label="Provider" options={options} />
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

        {selectedCode === 'MSG91' && (
          <TextField
            name="authKey"
            label="Auth key"
            type="password"
            description="MSG91 account auth key, from Authkey in the MSG91 panel. Checked against your MSG91 account before the provider is saved, then stored server-side and never returned."
          />
        )}
        {selectedCode === 'TWILIO' && (
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
        {selected && !selected.requiresCredentials && (
          <Typography variant="body2" intent="muted">
            No credentials needed for this provider.
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
