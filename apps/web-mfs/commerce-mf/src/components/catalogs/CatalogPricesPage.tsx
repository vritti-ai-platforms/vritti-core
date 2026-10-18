import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  getSelectionColumn,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Boxes, Coins, Eraser, Tag } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { VariantFacetsLine } from '@/components/VariantFacetsLine';
import type { CatalogListingData } from '@/schemas/catalogs';
import { currencyName } from '@/selectors/currency';
import type { CatalogsBinding } from './bindings';
import { BulkClearPriceDialog } from './forms/BulkClearPriceDialog';
import { BulkSetPriceDialog } from './forms/BulkSetPriceDialog';
import { SetListingPriceDialog } from './forms/SetListingPriceDialog';

interface CatalogPricesPageProps {
  binding: CatalogsBinding;
}

// The table holds one currency, and the backend resolved it to one row per listing: this workspace's own price when it
// set one, otherwise the price it inherits from a wider workspace
const resolvedPrice = (listing: CatalogListingData) => listing.prices[0];

// What one catalog charges in one currency — the drill-in behind a card on the Prices tab
export const CatalogPricesPage: React.FC<CatalogPricesPageProps> = ({ binding }) => {
  const { id: catalogId } = useSlugParams('slug');
  const { currencyCode = '' } = useParams();
  const queryClient = useQueryClient();

  const { data: catalog } = binding.useCatalog(catalogId);
  const { data: currencies = [], isLoading: currenciesLoading } = binding.useCurrencies(catalogId);
  const { data: response, isLoading } = binding.useCurrencyListingsTable(catalogId, currencyCode);
  const confirm = useConfirm();
  const clearMutation = binding.useClearListingPrice();
  const bulkPriceDialog = useDialog();
  const bulkClearPriceDialog = useDialog();
  // Held while a dialog is open: the selection bar hands its rows to the click, not to the dialog
  const [bulkIds, setBulkIds] = useState<string[]>([]);

  const openBulk = useCallback(
    (which: 'price' | 'clear-price', ids: string[]) => {
      setBulkIds(ids);
      if (which === 'price') bulkPriceDialog.open();
      else bulkClearPriceDialog.open();
    },
    [bulkClearPriceDialog, bulkPriceDialog],
  );

  const currency = currencies.find((entry) => entry.currencyCode === currencyCode);

  const handleClear = useCallback(
    async (row: CatalogListingData) => {
      const ok = await confirm({
        title: `Clear the ${currencyCode} price of "${row.code}"?`,
        description: 'Whatever a wider workspace charges applies again, or nothing if none of them priced it.',
        confirmLabel: 'Clear Price',
        variant: 'destructive',
      });
      if (ok) clearMutation.mutate({ catalogId, listingId: row.id, currencyCode });
    },
    [catalogId, clearMutation, confirm, currencyCode],
  );

  const columns = useMemo<ColumnDef<CatalogListingData>[]>(
    () => [
      getSelectionColumn<CatalogListingData>(),
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
            {row.original.mrp ? <CurrencyCell value={row.original.mrp} /> : <Badge variant="outline">Any batch</Badge>}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'price',
        header: () => <div className="text-center">Price</div>,
        cell: ({ row }) => {
          const price = resolvedPrice(row.original);
          return (
            <div className="flex justify-center">
              {price ? <CurrencyCell value={price.price} /> : <Badge variant="warning">Not priced</Badge>}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'pricedBy',
        header: () => <div className="text-center">Priced by</div>,
        cell: ({ row }) => {
          const price = resolvedPrice(row.original);
          if (!price) return <div className="text-center text-muted-foreground">—</div>;
          return (
            <div className="flex items-center justify-center gap-2">
              <Badge variant={price.canEdit ? 'secondary' : 'outline'}>{price.ownerName}</Badge>
              {/* Only the owner can change it, so saying whose it is also says why this row is read-only */}
              {price.canEdit ? null : <span className="text-muted-foreground text-xs">Inherited</span>}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original;
          const price = resolvedPrice(r);
          const own = price?.canEdit === true;
          const actions: RowAction[] = [
            {
              id: 'price',
              icon: Tag,
              label: own ? 'Change Price' : price ? 'Override Price' : 'Set Price',
              permission: binding.permissions.prices.set,
              dialog: {
                title: `${own ? 'Change' : price ? 'Override' : 'Set'} ${currencyCode} Price`,
                description: r.mrp
                  ? 'This listing is keyed to a printed MRP and cannot be priced above it.'
                  : 'This listing covers any batch, so billing caps the price at each pack’s printed MRP.',
                content: (close) => (
                  <SetListingPriceDialog
                    binding={binding}
                    catalogId={catalogId}
                    listing={r}
                    currencyCode={currencyCode}
                    onSuccess={close}
                    onCancel={close}
                  />
                ),
              },
            },
            {
              id: 'clear',
              icon: Eraser,
              label: 'Clear Price',
              variant: 'destructive',
              permission: binding.permissions.prices.clear,
              hidden: !own,
              onClick: () => handleClear(r),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [binding, catalogId, currencyCode, handleClear],
  );

  const { table } = useDataTable({
    columns,
    slug: binding.pricesTableSlug(catalogId),
    label: 'price',
    serverState: response,
    enableRowSelection: true,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () =>
      queryClient.invalidateQueries({ queryKey: binding.currencyListingsTableKey(catalogId, currencyCode) }),
  });

  const priced = currency?.pricedCount ?? 0;
  const total = currency?.listingCount ?? 0;

  // A currency the catalog never declared prices nothing, so the table would read as an empty shop
  if (!currenciesLoading && !currency) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`${currencyCode} prices`}
          description={`"${catalog.name}" does not price in ${currencyCode}.`}
        />
        <Empty
          icon={<Coins />}
          title={`Not priced in ${currencyCode}`}
          description="Add the currency on the Prices tab before pricing anything in it."
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`${currencyCode} prices`}
          description={`What "${catalog.name}" charges in ${currencyName(currencyCode)}.`}
          titleSlot={
            <Badge variant={priced === total && total > 0 ? 'success' : 'warning'}>
              {`${priced} of ${total} priced`}
            </Badge>
          }
        />

        <DataTable
          table={table}
          isLoading={isLoading}
          permission={binding.permissions.prices.view}
          selectActions={(rows) => {
            const ids = rows.map((row) => row.original.id);
            return (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  permission={binding.permissions.prices.set}
                  startAdornment={<Tag className="size-4" />}
                  onClick={() => openBulk('price', ids)}
                >
                  Set Price
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  permission={binding.permissions.prices.clear}
                  startAdornment={<Eraser className="size-4" />}
                  onClick={() => openBulk('clear-price', ids)}
                >
                  Remove Price
                </Button>
              </>
            );
          }}
          searchConfig={{
            columns: [
              { id: 'code', label: 'Code' },
              { id: 'offeringName', label: 'Variant' },
            ],
            searchAll: true,
          }}
          emptyStateConfig={{
            icon: Boxes,
            title: 'Nothing listed yet',
            description: 'Add listings on the Listings tab, then price them here.',
          }}
        />
      </div>

      <Dialog
        handle={bulkPriceDialog}
        icon={Tag}
        title={`Set ${currencyCode} Price`}
        description={`One price for ${pluralize('selected listing', bulkIds.length, true)}. A listing keyed to a printed MRP refuses a price above it.`}
        content={(close) => (
          <BulkSetPriceDialog
            binding={binding}
            catalogId={catalogId}
            ids={bulkIds}
            currencyCode={currencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={bulkClearPriceDialog}
        icon={Eraser}
        title={`Remove ${currencyCode} Price`}
        description={`Removes your ${currencyCode} price from ${pluralize('listing', bulkIds.length, true)}.`}
        content={(close) => (
          <BulkClearPriceDialog
            binding={binding}
            catalogId={catalogId}
            ids={bulkIds}
            currencyCode={currencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
