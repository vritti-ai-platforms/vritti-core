import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { type ColumnDef, CurrencyCell, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Package } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { ChannelItemData } from '@/schemas/catalog-channels';
import type { CatalogChannelsBinding } from './bindings';

interface ChannelItemsPageProps {
  binding: CatalogChannelsBinding;
}

/**
 * What one channel sells, item by item.
 *
 * The channel-centric half of the same exclusions data the catalog's Listings tab shows per item.
 * Curating a channel and curating an item are different jobs, so both views exist.
 */
export const ChannelItemsPage: React.FC<ChannelItemsPageProps> = ({ binding }) => {
  const { id: channelId } = useSlugParams('slug');
  const queryClient = useQueryClient();

  const { data: response, isLoading } = binding.useChannelItems(channelId);
  const visibilityMutation = binding.useSetChannelItemVisibility();

  const columns = useMemo<ColumnDef<ChannelItemData>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => <StringCell value={row.original.sku} mono />,
        enableSorting: true,
      },
      { accessorKey: 'variantName', header: 'Variant', enableSorting: false },
      {
        accessorKey: 'mrp',
        header: () => <div className="text-center">MRP</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.mrp ? <CurrencyCell value={row.original.mrp} /> : '—'}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'price',
        header: () => <div className="text-center">Price</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.price ? <CurrencyCell value={row.original.price} /> : '—'}
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
              permission={binding.permissions.edit}
              isLoading={visibilityMutation.isPending}
              onCheckedChange={(sellsHere) =>
                visibilityMutation.mutate({ channelId, listingId: row.original.listingId, sellsHere })
              }
              ariaLabel={`Sell ${row.original.sku ?? 'this item'} on this channel`}
            />
          </div>
        ),
        enableSorting: false,
      },
    ],
    [channelId, visibilityMutation, binding],
  );

  const { table } = useDataTable({
    columns,
    slug: binding.itemsTableSlug(channelId),
    label: 'item',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.itemsKey(channelId) }),
  });

  const total = response?.count ?? 0;
  const selling = response?.result.filter((item) => item.sellsHere).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Channel items" description="Everything this channel's catalog holds, and what it sells." />

      <Card>
        <CardContent className="grid gap-4 py-5 md:grid-cols-2">
          <DetailField
            label="Items on this page"
            type="string"
            value={`${selling} of ${response?.result.length ?? 0}`}
          />
          <DetailField label="Items in the catalog" type="number" value={total} />
        </CardContent>
      </Card>

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={binding.permissions.view}
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
    </div>
  );
};
