import { useQueryClient } from '@tanstack/react-query';
import { ORG_SALES_CHANNELS } from '@vritti/commerce-permissions/sales-channels';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Pencil, Plus, Radio, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { SALES_CHANNELS_TABLE_KEY, useDeleteSalesChannel, useSalesChannelsTable } from '@/hooks/organization/sales-channels';
import type { SalesChannelData } from '@/schemas/sales-channels';
import { AddSalesChannelDialog } from './forms/AddSalesChannelDialog';
import { EditSalesChannelDialog } from './forms/EditSalesChannelDialog';

export const SalesChannelsPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useSalesChannelsTable();
  const addDialog = useDialog();
  const confirm = useConfirm();

  const deleteMutation = useDeleteSalesChannel();

  const handleDelete = useCallback(
    async (row: SalesChannelData) => {
      const ok = await confirm({
        title: `Delete "${row.name}"?`,
        description: 'This permanently removes the channel. Only allowed when no catalog or order references it.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<SalesChannelData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'kind',
        header: 'Kind',
        cell: ({ row }) => <Badge variant="outline">{row.original.kind}</Badge>,
        enableSorting: true,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'secondary' : 'outline'}
            className={row.original.isActive ? 'bg-success/15 text-success' : ''}
          >
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'isSystem',
        header: '',
        cell: ({ row }) => (row.original.isSystem ? <Badge variant="outline">System</Badge> : null),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original;
          const actions: RowAction[] = [
            {
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              permission: ORG_SALES_CHANNELS.edit,
              dialog: {
                title: 'Edit Sales Channel',
                description: 'Rename the channel or toggle its status. Code and kind are immutable.',
                content: (close) => <EditSalesChannelDialog channel={r} onSuccess={close} onCancel={close} />,
              },
            },
          ];
          if (!r.isSystem) {
            actions.push({
              id: 'delete',
              icon: Trash2,
              label: 'Delete',
              variant: 'destructive',
              permission: ORG_SALES_CHANNELS.delete,
              onClick: () => handleDelete(r),
            });
          }
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-org-sales-channels',
    label: 'sales channel',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SALES_CHANNELS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales Channels"
        description="Define the channels you sell through — in-store, online, and aggregators."
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_SALES_CHANNELS.view}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_SALES_CHANNELS.add}
            >
              Add Channel
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Radio,
          title: 'No sales channels',
          description: 'Add a channel to start scoping catalogs and orders.',
          action: (
            <Button
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_SALES_CHANNELS.add}
            >
              Add Channel
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Radio}
        title="Add Sales Channel"
        description="Create a new channel for catalog and order scoping."
        content={(close) => <AddSalesChannelDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
