import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateWhatsappAccount } from '@/hooks/organization/whatsapp-accounts';
import { type ConnectWhatsappAccountFormData, connectWhatsappAccountSchema } from '@/schemas/whatsapp-accounts';

interface ConnectWhatsappAccountDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const ConnectWhatsappAccountDialog: React.FC<ConnectWhatsappAccountDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<ConnectWhatsappAccountFormData>({
    resolver: zodResolver(connectWhatsappAccountSchema),
    defaultValues: {
      name: '',
      metaBusinessId: '',
      wabaId: '',
      accessToken: '',
      isDefault: false,
    },
  });

  const createMutation = useCreateWhatsappAccount({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="space-y-4">
        <TextField
          name="name"
          label="Name"
          placeholder="e.g. Desi Taakat"
          description="How this account appears in Vritti — not the name shown to customers"
        />
        <TextField
          name="metaBusinessId"
          label="Business portfolio ID"
          placeholder="1234567890123456"
          description="Meta Business Portfolio that owns the WABA"
        />
        <TextField name="wabaId" label="WABA ID" placeholder="9876543210987654" />
        <TextField
          name="accessToken"
          label="Access token"
          type="password"
          description="Long-lived Meta system-user token. Stored server-side and never returned."
        />
        <Switch
          name="isDefault"
          label="Default sender"
          description="Use this account when nothing else narrows the choice"
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Connecting...">
          Connect account
        </Button>
      </DialogActions>
    </Form>
  );
};
