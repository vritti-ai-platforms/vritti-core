import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreditNotesTable } from '@/site/hooks/credit-notes';
import { CreateCreditNoteDialog } from './forms/CreateCreditNoteDialog';

const statusVariant = (status: string): { variant: 'secondary' | 'outline' | 'destructive'; className?: string } => {
  switch (status) {
    case 'ACTIVE':
      return { variant: 'secondary', className: 'bg-success/15 text-success' };
    case 'FULLY_APPLIED':
      return { variant: 'outline' };
    case 'VOID':
      return { variant: 'destructive' };
    default:
      return { variant: 'secondary' };
  }
};

export const CreditNotesPage = () => {
  const navigate = useNavigate();
  const { data: creditNotes, isLoading } = useCreditNotesTable();
  const addDialog = useDialog();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Credit Notes" description="Manage credit notes and apply them to invoices" />
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Credit Notes"
        description="Manage credit notes and apply them to invoices"
        actions={
          <Button size="sm" onClick={addDialog.open}>
            <Plus className="mr-2 size-4" />
            New Credit Note
          </Button>
        }
      />

      {!creditNotes || creditNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 size-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No credit notes</p>
            <p className="mb-4 text-muted-foreground">Create your first credit note to get started.</p>
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Credit Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">CN Number</th>
                <th className="pb-2 font-medium">Party</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Amount</th>
                <th className="pb-2 font-medium text-right">Applied</th>
                <th className="pb-2 font-medium text-right">Remaining</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {creditNotes.map((cn) => {
                const badge = statusVariant(cn.status);
                return (
                  <tr key={cn.id} className="border-b last:border-0">
                    <td className="py-3 font-mono font-medium">{cn.creditNoteNumber}</td>
                    <td className="py-3">{cn.partyName}</td>
                    <td className="py-3">
                      <Badge
                        variant="secondary"
                        className={cn.type === 'PAYABLE' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}
                      >
                        {cn.type === 'PAYABLE' ? 'Payable' : 'Receivable'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-mono">{Number(cn.amount).toFixed(2)}</td>
                    <td className="py-3 text-right font-mono">{Number(cn.appliedAmount).toFixed(2)}</td>
                    <td className="py-3 text-right font-mono">{Number(cn.remaining).toFixed(2)}</td>
                    <td className="py-3">
                      <Badge variant={badge.variant} className={badge.className}>
                        {cn.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => navigate(buildSlug(cn.creditNoteNumber, cn.id))}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        handle={addDialog}
        icon={FileText}
        title="New Credit Note"
        description="Create a credit note for a supplier or customer."
        content={(close) => <CreateCreditNoteDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
