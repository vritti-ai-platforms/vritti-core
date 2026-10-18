import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, CurrencyCell, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Package } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { VariantFacetsLine } from '@/components/VariantFacetsLine';
import type { ChannelPriceData } from '@/schemas/catalog-channels';
import { currencyName } from '@/selectors/currency';
import type { CatalogChannelsBinding } from './bindings';

interface ChannelPricesPageProps {
  binding: CatalogChannelsBinding;
}

// What one channel charges in one currency, and what it holds back from that currency
export const ChannelPricesPage: React.FC<ChannelPricesPageProps> = ({ binding }) => {
  const { id: channelId } = useSlugParams('slug');
  const { currencyCode = '' } = useParams();
  const queryClient = useQueryClient();

  const { data: response, isLoading } = binding.useChannelPrices(channelId, currencyCode);
  const visibilityMutation = binding.useSetChannelItemVisibility();

  const columns = useMemo<ColumnDef<ChannelPriceData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'offeringName',
        header: 'Variant',
        // The offering names it; the facets under it are what tell this row from its siblings
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.offeringName}</span>
            <VariantFacetsLine dimensions={row.original.dimensions} />
          </div>
        ),
        enableSorting: false,
      },
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
        id: 'price',
        header: () => <div className="text-center">Price</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.price ? (
              <CurrencyCell value={row.original.price} />
            ) : (
              <Badge variant="warning">Not priced</Badge>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'pricedBy',
        header: () => <div className="text-center">Priced by</div>,
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.priceOwnerName ? (
              <Badge variant="secondary">{row.original.priceOwnerName}</Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'availableHere',
        header: () => <div className="text-center">{`Available in ${currencyCode}`}</div>,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex justify-center">
              <StatusSwitch
                checked={r.availableHere}
                // Nothing to be available at until someone prices it, so it is not a green state
                tone={r.price === null ? 'warning' : 'success'}
                activeLabel={r.price === null ? 'Not priced' : 'Available'}
                inactiveLabel="Excluded"
                permission={binding.permissions.setAvailability}
                // Excluded from the channel outright, or priced by nobody — neither is this switch's business, and
                // flipping it on would not make the item available
                disabled={r.excludedOutright || r.price === null}
                disabledTip={
                  r.excludedOutright
                    ? 'Excluded from this channel — make it available under Listings'
                    : `Nobody has priced it in ${currencyCode}`
                }
                isLoading={visibilityMutation.isPending}
                onCheckedChange={(availableHere) =>
                  visibilityMutation.mutate({ channelId, listingId: r.listingId, availableHere, currencyCode })
                }
                ariaLabel={`Offer ${r.code} in ${currencyCode} on this channel`}
              />
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [binding, channelId, currencyCode, visibilityMutation],
  );

  const { table } = useDataTable({
    columns,
    slug: binding.pricesTableSlug(channelId),
    label: 'price',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.pricesKey(channelId, currencyCode) }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${currencyCode} prices`}
        description={`What this channel charges in ${currencyName(currencyCode)}, and what it excludes.`}
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        permission={binding.permissions.prices}
        searchConfig={{
          columns: [
            { id: 'code', label: 'Code' },
            { id: 'offeringName', label: 'Variant' },
          ],
          searchAll: true,
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'Nothing available',
          description: 'This catalog has no active items, so the channel returns nothing.',
        }}
      />
    </div>
  );
};
