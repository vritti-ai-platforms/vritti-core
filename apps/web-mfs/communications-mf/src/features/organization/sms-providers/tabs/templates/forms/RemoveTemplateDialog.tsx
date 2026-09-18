import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Typography } from '@vritti/quantum-ui/Typography';
import { useDeleteSmsProviderTemplate } from '@/hooks/organization/sms-provider-templates';
import type { SmsProviderTemplateData } from '@/schemas/sms-provider-templates';

interface RemoveTemplateDialogProps {
  providerId: string;
  template: SmsProviderTemplateData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Removes Vritti's row only. The opposite of the WhatsApp templates tab, whose delete reaches
// through to Meta — worth saying plainly, because the button looks identical.
export const RemoveTemplateDialog = ({ providerId, template, onSuccess, onCancel }: RemoveTemplateDialogProps) => {
  const deleteMutation = useDeleteSmsProviderTemplate(providerId, { onSuccess });

  return (
    <div className="flex flex-col gap-4">
      <Typography variant="body2">
        Vritti forgets <strong>{template.name}</strong>. The template itself stays in MSG91 and can be added again.
      </Typography>
      <Typography variant="body2" intent="muted">
        Any app configured to send sign-in codes with it will fail until another template is chosen.
      </Typography>

      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          isLoading={deleteMutation.isPending}
          loadingText="Removing..."
          onClick={() => deleteMutation.mutate(template.id)}
        >
          Remove
        </Button>
      </DialogActions>
    </div>
  );
};
