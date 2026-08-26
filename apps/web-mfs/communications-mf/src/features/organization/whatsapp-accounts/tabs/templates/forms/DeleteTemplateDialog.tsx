import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Trash2 } from 'lucide-react';
import { useDeleteWhatsappTemplate } from '@/hooks/organization/whatsapp-accounts';
import type { WhatsappTemplateData } from '@/schemas/whatsapp-templates';

interface DeleteTemplateDialogProps {
  accountId: string;
  template: WhatsappTemplateData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Confirmation with a live pending state — the dialog stays open while Meta processes the delete
// and closes only on success (useConfirm resolves on click, so it cannot show progress)
export const DeleteTemplateDialog = ({ accountId, template, onSuccess, onCancel }: DeleteTemplateDialogProps) => {
  const deleteMutation = useDeleteWhatsappTemplate(accountId, { onSuccess });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-6 py-4">
        <Typography variant="body2">
          Delete <span className="font-medium font-mono">{template.name}</span>
          {template.language ? ` (${template.language})` : ''} from this WhatsApp Business Account?
        </Typography>
        <Typography variant="body2" intent="muted">
          Meta blocks reusing a deleted template name for 30 days.
        </Typography>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={deleteMutation.isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          isLoading={deleteMutation.isPending}
          startAdornment={<Trash2 className="size-4" />}
          onClick={() => deleteMutation.mutate({ templateId: template.id, name: template.name })}
        >
          Delete
        </Button>
      </DialogActions>
    </div>
  );
};
