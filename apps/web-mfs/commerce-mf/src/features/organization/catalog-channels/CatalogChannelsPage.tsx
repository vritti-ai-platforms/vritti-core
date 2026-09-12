import { useQueryClient } from '@tanstack/react-query';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, type RowAction, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Route, Shuffle, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  CATALOG_CHANNELS_TABLE_KEY,
  useCatalogChannelsTable,
  useDeleteCatalogChannel,
} from '@/hooks/organization/catalog-channels';
import { CATALOG_CHANNEL_TYPES, type CatalogChannelData, CHANNEL_TYPE_META } from '@/schemas/catalog-channels';
import { ResolveChannelCard } from './components/ResolveChannelCard';
import { AddChannelDialog } from './forms/AddChannelDialog';
import { RepointChannelDialog } from './forms/RepointChannelDialog';

// Broadest first, so the fallback order reads down the column the way resolution walks it
const scopeLabel = (row: CatalogChannelData) =>
  row.siteId ? 'One outlet' : row.legalEntityId ? 'One company' : 'Whole organization';

export const CatalogChannelsPage = () => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useCatalogChannelsTable();
  const addDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteCatalogChannel();

  const handleDelete = useCallback(
    async (row: CatalogChannelData) => {
      const ok = await confirm({
        title: 'Remove this channel?',
        description: `Nothing will resolve for ${CHANNEL_TYPE_META[row.type].label} at this scope until another catalog claims it.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<CatalogChannelData>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{CHANNEL_TYPE_META[row.original.type].label}</Badge>,
        enableSorting: true,
      },
      {
        id: 'target',
        header: 'Specific',
        cell: ({ row }) => {
          const r = row.original;
          if (r.terminalId) return r.terminalName ?? 'One till';
          if (r.appId) return 'One app';
          return <span className="text-muted-foreground">{r.type === 'POS' ? 'Any till' : 'Any app'}</span>;
        },
        enableSorting: false,
      },
      {
        id: 'scope',
        header: 'Selling from',
        cell: ({ row }) => scopeLabel(row.original),
        enableSorting: false,
      },
      {
        accessorKey: 'catalogName',
        header: 'Sells',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.catalogName ?? '—'}</span>
            {row.original.catalogIsActive ? null : <Badge variant="warning">Draft</Badge>}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original;
          const actions: RowAction[] = [
            {
              id: 'repoint',
              icon: Shuffle,
              label: 'Repoint',
              permission: ORG_CATALOG_CHANNELS.edit,
              dialog: {
                title: 'Repoint Channel',
                description: 'Point this channel at a different catalog. Its type and scope stay as they are.',
                content: (close) => <RepointChannelDialog channel={r} onSuccess={close} onCancel={close} />,
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Remove',
              variant: 'destructive',
              permission: ORG_CATALOG_CHANNELS.delete,
              onClick: () => handleDelete(r),
            },
          ];
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
    slug: 'commerce-org-catalog-channels',
    label: 'channel',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: CATALOG_CHANNELS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catalog Channels"
        description="Which catalog each channel sells. The most specific binding wins — a till beats an outlet, an outlet beats a company."
      />

      <ResolveChannelCard />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_CATALOG_CHANNELS.view}
        filters={[
          <SelectFilter
            key="type"
            name="type"
            label="Type"
            options={CATALOG_CHANNEL_TYPES.map((value) => ({ label: CHANNEL_TYPE_META[value].label, value }))}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addDialog.open} permission={ORG_CATALOG_CHANNELS.add}>
              Add Channel
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Route,
          title: 'No channels yet',
          description: 'Until a channel points at a catalog, nothing you sell is reachable. Add one to start.',
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Route}
        title="Add Channel"
        description="Bind a channel to the catalog it sells. Leave the company and outlet empty to cover the whole organization."
        content={(close) => <AddChannelDialog onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
