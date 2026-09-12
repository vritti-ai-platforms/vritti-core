import { useQueryClient } from '@tanstack/react-query';
import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DangerZone } from '@vritti/quantum-ui/DangerZone';
import { type ColumnDef, CurrencyCell, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Package } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusSwitch } from '@/components/StatusSwitch';
import { type ChannelItemData, SCOPE_LABEL, SCOPE_TITLE } from '@/schemas/catalog-channels';
import { EditAppChannelDialog } from './forms/EditAppChannelDialog';
import type { CatalogChannelsBinding } from './types';

interface AppChannelDetailPageProps {
  binding: CatalogChannelsBinding;
}

export const AppChannelDetailPage: React.FC<AppChannelDetailPageProps> = ({ binding }) => {
  const { id: channelId } = useSlugParams('slug');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const editDialog = useDialog();
  const confirm = useConfirm();

  const { data: channels } = binding.useAppChannels();
  const current = channels?.result.find((row) => row.id === channelId);
  const { data: response, isLoading } = binding.useAppItems(channelId);
  const visibilityMutation = binding.useSetItemVisibility();
  const deleteMutation = binding.useDeleteAppChannel({ onSuccess: () => navigate('..') });

  const handleDelete = async () => {
    if (!current) return;
    const ok = await confirm({
      title: current.isFallback ? 'Remove the fallback catalog?' : `Stop "${current.label}" selling this catalog?`,
      description: current.isFallback
        ? 'The catalog itself is untouched. Callers with no app of their own will fall back to a wider scope, or sell nothing.'
        : 'The catalog itself is untouched. This app falls back to Any app, and its exclusions go with it.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(current.id);
  };

  const isOwn = current?.isOwn ?? false;
  const inheritedFrom = current ? SCOPE_LABEL[current.setAt] : '';

  const handleToggle = useCallback(
    (item: ChannelItemData, sellsHere: boolean) =>
      visibilityMutation.mutate({ channelId, listingId: item.listingId, sellsHere }),
    [channelId, visibilityMutation],
  );

  const columns = useMemo<ColumnDef<ChannelItemData>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: () => <div className="text-center">SKU</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StringCell value={row.original.sku} mono />
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'variantName',
        header: () => <div className="text-center">Variant</div>,
        cell: ({ row }) => <div className="text-center">{row.original.variantName}</div>,
        enableSorting: true,
      },
      {
        accessorKey: 'mrp',
        header: () => <div className="text-center">MRP</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <CurrencyCell value={row.original.mrp} />
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'price',
        header: () => <div className="text-center">Price</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <CurrencyCell value={row.original.price} />
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'sellsHere',
        header: () => <div className="text-center">Sells here</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusSwitch
              checked={row.original.sellsHere}
              onCheckedChange={(checked) => handleToggle(row.original, checked)}
              ariaLabel={`Sell ${row.original.sku ?? 'item'} on this channel`}
              permission={ORG_CATALOG_CHANNELS.edit}
              disabled={!isOwn}
              disabledTip={`Set by the ${inheritedFrom} — override this binding to change it`}
              activeLabel="Sells"
              inactiveLabel="Excluded"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleToggle, inheritedFrom, isOwn],
  );

  const { table } = useDataTable({
    columns,
    slug: `commerce-${binding.scopeSegment}-app-channel-${channelId}-items`,
    label: 'item',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.appItemsKey(channelId) }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={current?.label ?? 'App catalog'}
        description={
          current?.isFallback
            ? 'The fallback every unnamed caller gets'
            : 'A named app — outranks Any app for this caller'
        }
        actions={
          <Button size="sm" onClick={editDialog.open} permission={ORG_CATALOG_CHANNELS.edit} disabled={!isOwn}>
            Change catalog
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-4 py-5 md:grid-cols-3">
          <DetailField label="Sells" type="string" value={current?.catalogName} />
          <DetailField
            label="Items reaching"
            type="string"
            value={current ? `${current.itemsSelling} of ${current.itemsTotal}` : null}
          />
          <DetailField label="Set at" type="string" value={current ? SCOPE_TITLE[current.setAt] : null} />
        </CardContent>
      </Card>

      {current && !isOwn ? (
        <Alert variant="warning" title={`Set by the ${inheritedFrom} — read-only here`}>
          Exclusions belong to the binding that owns them, so changing one here would change it for everyone inheriting
          it. Override this channel to choose what this {binding.scopeNoun} sells.
        </Alert>
      ) : null}

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={ORG_CATALOG_CHANNELS.view}
        searchConfig={{
          columns: [
            { id: 'sku', label: 'SKU' },
            { id: 'variantName', label: 'Variant' },
          ],
          searchAll: true,
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'Nothing to sell',
          description: 'This catalog has no active items, so the channel returns nothing.',
        }}
      />

      {current ? (
        <DangerZone
          title={current.isFallback ? 'Remove the fallback catalog' : 'Remove this catalog'}
          description={
            current.isFallback
              ? 'The catalog itself is untouched — callers with no app of their own fall back to a wider scope, or sell nothing.'
              : 'The catalog itself is untouched — this app falls back to Any app, and its exclusions go with it.'
          }
          buttonText="Remove Catalog"
          permission={ORG_CATALOG_CHANNELS.edit}
          onClick={handleDelete}
          disabled={!isOwn}
          warning={`Set by the ${inheritedFrom} — remove it there.`}
          showWarning={!isOwn}
        />
      ) : null}

      {current ? (
        <Dialog
          handle={editDialog}
          icon={Package}
          title={`${current.label} sells`}
          description="Pick the catalog this channel sells."
          content={(close) => (
            <EditAppChannelDialog
              channel={current}
              useUpdate={binding.useUpdateAppChannel}
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      ) : null}
    </div>
  );
};
