import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { useForm } from 'react-hook-form';
import { useAddSmsProviderTemplate } from '@/hooks/organization/sms-provider-templates';
import { type AddSmsProviderTemplateFormData, addSmsProviderTemplateSchema } from '@/schemas/sms-provider-templates';

interface AddTemplateDialogProps {
  providerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// The ID is typed rather than picked: MSG91 exposes no endpoint that lists an account's SMS
// templates, so there is nothing to populate a dropdown from. The server checks the ID with the
// vendor before storing it, so a wrong one fails here rather than at send time.
export const AddTemplateDialog = ({ providerId, onSuccess, onCancel }: AddTemplateDialogProps) => {
  const form = useForm<AddSmsProviderTemplateFormData>({
    resolver: zodResolver(addSmsProviderTemplateSchema),
    defaultValues: { templateId: '', name: '' },
  });

  const addMutation = useAddSmsProviderTemplate(providerId, { onSuccess });

  return (
    <Form form={form} mutation={addMutation} onCancel={onCancel}>
      <div className="space-y-4">
        <TextField
          name="templateId"
          label="Template ID"
          placeholder="e.g. 68b3f2a17c1e4a0f9c2b1d34"
          description="From your MSG91 panel, on the template (its panel also calls this the flow ID)."
        />
        <TextField
          name="name"
          label="Name"
          placeholder="e.g. Sign-in code"
          description="How this template appears in Vritti"
        />
        <Typography variant="body2" intent="muted">
          Vritti reads the template from MSG91 with this provider's stored key before saving it. If the key or the ID is
          wrong, nothing is stored.
        </Typography>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Checking with MSG91...">
          Add template
        </Button>
      </DialogActions>
    </Form>
  );
};
