import { useQueryClient } from '@tanstack/react-query';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, type RowAction, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Plus, Route } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type CatalogChannelData, SCOPE_TITLE } from '@/schemas/catalog-channels';
import { AddAppChannelDialog } from './forms/AddAppChannelDialog';
import type { CatalogChannelsBinding } from './types';

interface AppChannelPageProps {
  binding: CatalogChannelsBinding;
}

export const AppChannelPage: React.FC<AppChannelPageProps> = ({ binding }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addDialog = useDialog();
  const { data: response, isLoading } = binding.useAppChannels();

  const columns = useMemo<ColumnDef<CatalogChannelData>[]>(
    () => [
      {
        accessorKey: 'label',
        header: () => <div className="text-center">Target</div>,
        cell: ({ row }) => (
          <div className="flex flex-col items-center">
            <span className="font-medium">{row.original.label}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.isFallback ? 'Fallback' : 'Overrides Any app'}
            </span>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'catalogName',
        header: () => <div className="text-center">Sells</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <span>{row.original.catalogName ?? '—'}</span>
            {row.original.catalogIsActive ? null : <Badge variant="warning">Draft</Badge>}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'items',
        header: () => <div className="text-center">Items reaching</div>,
        cell: ({ row }) => (
          <div className="text-center">{`${row.original.itemsSelling} of ${row.original.itemsTotal}`}</div>
        ),
        enableSorting: false,
      },
      {
        id: 'setAt',
        header: () => <div className="text-center">Set at</div>,
        cell: ({ row }) => <div className="text-center">{SCOPE_TITLE[row.original.setAt]}</div>,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original;
          const actions: RowAction[] = [
            {
              id: 'view',
              icon: Eye,
              label: 'View items',
              permission: ORG_CATALOG_CHANNELS.view,
              onClick: () => navigate(buildSlug(r.label, r.id)),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: `commerce-${binding.scopeSegment}-app-channels`,
    label: 'catalog',
    serverState: response,
    enableRowSelection: false,
    enableSorting: false,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.appChannelsKey }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="App Channel"
        description="Each row is a catalog this channel sells, and the items reaching it. Every unnamed caller falls back to Any app."
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_CATALOG_CHANNELS.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_CATALOG_CHANNELS.edit}
            >
              Add Catalog
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Route,
          title: 'Nothing sells through App',
          description: 'Add a catalog and it appears here with the items it puts in front of callers.',
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Route}
        title="Add Catalog"
        description="Pick the catalog this channel sells, and optionally the single app it applies to."
        content={(close) => (
          <AddAppChannelDialog useCreate={binding.useCreateAppChannel} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
