import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, FlaskConical, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONVERSIONS_TABLE_KEY, useConversionsTable } from '@/hooks/conversions';
import type { ConversionData, ConversionStatus } from '@/schemas/conversions';
import { CreateConversionDialog } from './forms/CreateConversionDialog';

const statusConfig: Record<
  ConversionStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  IN_PROGRESS: { label: 'In Progress', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  COMPLETED: { label: 'Completed', variant: 'secondary', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const ConversionsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useConversionsTable();
  const addDialog = useDialog();

  const columns = useMemo<ColumnDef<ConversionData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.id.slice(0, 8)}</span>,
      },
      {
        accessorKey: 'bomName',
        header: 'BOM',
        cell: ({ row }) => row.original.bomName ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = statusConfig[row.original.status];
          return (
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'producedBy',
        header: 'Produced By',
        cell: ({ row }) => row.original.producedBy ?? '—',
      },
      {
        accessorKey: 'startedAt',
        header: 'Started',
        cell: ({ row }) => <FormattedDate value={row.original.startedAt} dateFormat="P" />,
        enableSorting: true,
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: ({ row }) => <FormattedDate value={row.original.completedAt} dateFormat="P" />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                onClick: () => navigate(buildSlug(row.original.id.slice(0, 8), row.original.id)),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-conversions',
    label: 'conversion',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: CONVERSIONS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Conversions" description="Track material-to-product conversions and production runs" />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'bomName', label: 'BOM' },
            { id: 'producedBy', label: 'Produced By' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Conversion
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: FlaskConical,
          title: 'No conversions',
          description: 'Create your first conversion to track production runs.',
          action: (
            <Button onClick={addDialog.open}>
              <Plus className="mr-2 size-4" />
              New Conversion
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        title="New Conversion"
        description="Create a conversion to track inputs and outputs."
        className="sm:max-w-2xl"
        content={(close) => <CreateConversionDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
