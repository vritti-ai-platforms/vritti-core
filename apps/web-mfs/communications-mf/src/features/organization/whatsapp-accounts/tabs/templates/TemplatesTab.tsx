import { useQueryClient } from '@tanstack/react-query';
import { ORG_WHATSAPP_ACCOUNTS } from '@vritti/communications-permissions/whatsapp-accounts';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { LayoutTemplate } from 'lucide-react';
import { useMemo } from 'react';
import { useWhatsappTemplates, WHATSAPP_ACCOUNT_TEMPLATES_KEY } from '@/hooks/organization/whatsapp-accounts';
import type { WhatsappTemplateData } from '@/schemas/whatsapp-templates';

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
    ],
    [],
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
        isLoading={isLoading}
        // TEMP: account-level view until templates.view is authored in the cloud catalog (after the full templates feature ships)
        permission={ORG_WHATSAPP_ACCOUNTS.view}
        enableViews={false}
        emptyStateConfig={{
          icon: LayoutTemplate,
          title: 'No message templates yet',
          description: 'Templates created for this WhatsApp Business Account in Meta appear here.',
        }}
      />
    </div>
  );
};
