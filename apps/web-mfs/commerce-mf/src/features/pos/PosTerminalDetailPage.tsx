import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Monitor, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDeletePosTerminal, usePosTerminal } from '@/hooks/pos-terminals';
import { getErrorMessage } from '@/utils/error';
import { TerminalPriceListsPanel } from './components/TerminalPriceListsPanel';
import { PosTerminalForm } from './forms/PosTerminalForm';

export const PosTerminalDetailPage = () => {
  const { id } = useSlugParams('terminalSlug');
  const navigate = useNavigate();
  const { data: terminal, isLoading, error } = usePosTerminal(id ?? null);
  const editDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeletePosTerminal();

  const handleDelete = async () => {
    if (!terminal) return;
    const confirmed = await confirm({
      title: `Delete "${terminal.name}"?`,
      description: 'This POS terminal and its price list assignments will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(terminal.id, { onSuccess: () => navigate('..') });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive" title="Failed to load" description={getErrorMessage(error)} />;
  }

  if (!terminal) {
    return <Empty icon={<Monitor />} title="Terminal not found" description="This POS terminal no longer exists." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={terminal.name}
        description={terminal.description ?? 'No description'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={editDialog.open}
              startAdornment={<Pencil className="size-4" />}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              isLoading={deleteMutation.isPending}
              className="text-destructive hover:text-destructive"
              startAdornment={<Trash2 className="size-4" />}
            >
              Delete
            </Button>
          </div>
        }
      />

      <TerminalPriceListsPanel terminal={terminal} />

      <Dialog
        handle={editDialog}
        title="Edit POS Terminal"
        description="Update terminal details."
        className="max-w-lg"
        content={(close) => <PosTerminalForm terminal={terminal} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
