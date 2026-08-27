import { useQueryClient } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Eye, LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useWhatsappTemplates, WHATSAPP_ACCOUNT_TEMPLATES_KEY } from '@/hooks/organization/whatsapp-accounts';
import type { WhatsappTemplateData } from '@/schemas/whatsapp-templates';
import { CreateTemplateDialog } from './forms/CreateTemplateDialog';
import { DeleteTemplateDialog } from './forms/DeleteTemplateDialog';
import { TemplatePreviewDialog } from './forms/TemplatePreviewDialog';

interface TemplatesTabProps {
  accountId: string;
}

// Meta's template review status
const StatusBadge = ({ status }: { status: string | null }) => {
  if (!status) return null;
  if (status === 'APPROVED') return <Badge variant="success">Approved</Badge>;
  if (status === 'PENDING') return <Badge variant="secondary">Pending</Badge>;
  if (status === 'REJECTED') return <Badge variant="destructive">Rejected</Badge>;
  if (status === 'PAUSED' || status === 'DISABLED') return <Badge variant="destructive">{status.toLowerCase()}</Badge>;
  return <Badge variant="outline">{status.toLowerCase().replace(/_/g, ' ')}</Badge>;
};

// Meta's template quality score (GREEN/YELLOW/RED, UNKNOWN until traffic flows)
const QualityBadge = ({ score }: { score: string | null }) => {
  if (!score || score === 'UNKNOWN') return <Badge variant="outline">Unknown</Badge>;
  if (score === 'GREEN') return <Badge variant="success">Good</Badge>;
  if (score === 'RED') return <Badge variant="destructive">Low</Badge>;
  return <Badge variant="secondary">{score.toLowerCase()}</Badge>;
};

// Rows are read live from Meta — review status and quality are always current. One row per
// name+language pair, exactly as Meta models templates.
export const TemplatesTab = ({ accountId }: TemplatesTabProps) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useWhatsappTemplates(accountId);
  const createDialog = useDialog();

  // Every column carries an explicit size: DataTable takes the table's minWidth from their total, so the
  // TanStack default of 150px each would force a horizontal scrollbar the content does not need.
  const columns = useMemo<ColumnDef<WhatsappTemplateData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <StringCell value={row.original.name} mono />,
        enableSorting: false,
        size: 240,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) =>
          row.original.category ? <Badge variant="outline">{row.original.category.toLowerCase()}</Badge> : null,
        enableSorting: false,
        size: 140,
      },
      {
        accessorKey: 'language',
        header: 'Language',
        cell: ({ row }) => <StringCell value={row.original.language ?? ''} mono />,
        enableSorting: false,
        size: 110,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        enableSorting: false,
        size: 130,
      },
      {
        accessorKey: 'qualityScore',
        header: 'Quality',
        cell: ({ row }) => <QualityBadge score={row.original.qualityScore} />,
        enableSorting: false,
        size: 110,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'preview',
                icon: Eye,
                label: 'Preview',
                permission: ORG_WHATSAPP_ACCOUNTS.templates.view,
                dialog: {
                  title: row.original.name,
                  description:
                    [row.original.category?.toLowerCase(), row.original.language].filter(Boolean).join(' · ') ||
                    'Template preview',
                  content: (close) => (
                    <TemplatePreviewDialog accountId={accountId} template={row.original} onClose={close} />
                  ),
                },
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                permission: ORG_WHATSAPP_ACCOUNTS.templates.delete,
                dialog: {
                  title: 'Delete template?',
                  description: 'This removes the template from the WhatsApp Business Account in Meta.',
                  content: (close) => (
                    <DeleteTemplateDialog
                      accountId={accountId}
                      template={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 90,
      },
    ],
    [accountId],
  );

  // Sorting is off deliberately: the rows come live from Meta, which cannot sort or filter this list
  const { table } = useDataTable({
    columns,
    slug: 'communications-org-whatsapp-templates',
    label: 'template',
    serverState: response,
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNT_TEMPLATES_KEY(accountId) }),
  });

  return (
    <div className="flex flex-col gap-6">
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={ORG_WHATSAPP_ACCOUNTS.templates.view}
        enableViews={false}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              permission={ORG_WHATSAPP_ACCOUNTS.templates.add}
              onClick={createDialog.open}
            >
              Create template
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: LayoutTemplate,
          title: 'No message templates yet',
          description: 'Templates created for this WhatsApp Business Account in Meta appear here.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              permission={ORG_WHATSAPP_ACCOUNTS.templates.add}
              onClick={createDialog.open}
            >
              Create template
            </Button>
          ),
        }}
      />

      <Dialog
        handle={createDialog}
        icon={LayoutTemplate}
        title="Create template"
        description="Start from Meta's pre-approved library, or build custom content that goes through review."
        className="max-w-3xl"
        content={(close) => <CreateTemplateDialog accountId={accountId} onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
