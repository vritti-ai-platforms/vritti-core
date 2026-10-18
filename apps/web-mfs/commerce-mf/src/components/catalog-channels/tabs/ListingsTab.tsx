import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, CurrencyCell, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Package } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { ChannelItemData } from '@/schemas/catalog-channels';
import type { CatalogChannelsBinding } from '../bindings';

interface ListingsTabProps {
  binding: CatalogChannelsBinding;
  channelId: string;
}

// What this channel carries.
// What this channel carries. Whether it is available at a given price, in a given currency, is the Prices tab.
export const ListingsTab: React.FC<ListingsTabProps> = ({ binding, channelId }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = binding.useChannelItems(channelId);
  const visibilityMutation = binding.useSetChannelItemVisibility();

  const columns = useMemo<ColumnDef<ChannelItemData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
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
        id: 'availableHere',
        header: () => <div className="text-center">Available here</div>,
        cell: ({ row }) => {
          const purchasable = row.original.availableCurrencyCodes.length > 0;
          return (
            <div className="flex justify-center">
              <StatusSwitch
                checked={row.original.availableHere}
                tone={purchasable ? 'success' : 'warning'}
                activeLabel={purchasable ? 'Available' : 'Not priced'}
                inactiveLabel="Excluded"
                permission={binding.permissions.visibility}
                isLoading={visibilityMutation.isPending}
                onCheckedChange={(availableHere) =>
                  visibilityMutation.mutate({ channelId, listingId: row.original.listingId, availableHere })
                }
                ariaLabel={`Offer ${row.original.code} on this channel`}
              />
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'availableCurrencies',
        header: () => <div className="text-center">Available in</div>,
        cell: ({ row }) => {
          const { availableCurrencyCodes: codes, availableHere } = row.original;
          return (
            <div className="flex flex-wrap justify-center gap-1">
              {/* Empty has two causes and the reader can act on only one of them, so it says which:
                  excluded from the channel, or carried but priced in no currency the catalog offers */}
              {codes.length === 0 ? (
                <Badge variant="warning">{availableHere ? 'Not priced' : 'Excluded'}</Badge>
              ) : (
                codes.map((code) => (
                  <Badge key={code} variant="secondary">
                    {code}
                  </Badge>
                ))
              )}
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [binding, channelId, visibilityMutation],
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

  const available = response?.result.filter((item) => item.availableHere).length ?? 0;
  const onPage = response?.result.length ?? 0;

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      permission={binding.permissions.listings}
      searchConfig={{
        columns: [
          { id: 'code', label: 'Code' },
          { id: 'variantName', label: 'Variant' },
        ],
        searchAll: true,
      }}
      toolbarActions={{
        actions: (
          <span className="text-muted-foreground text-sm">
            {`${available} of ${onPage} ${pluralize('item', onPage)} available on this page`}
          </span>
        ),
      }}
      emptyStateConfig={{
        icon: Package,
        title: 'Nothing available',
        description: 'This catalog has no active items, so the channel returns nothing.',
      }}
    />
  );
};
