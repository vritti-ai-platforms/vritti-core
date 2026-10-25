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
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Boxes, Eraser, IndianRupee, Layers, Plus, Radio, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VariantFacetsLine } from '@/components/VariantFacetsLine';
import type { CatalogListingData } from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';
import { AddListingDialog } from '../forms/AddListingDialog';
import { BulkAvailabilityDialog } from '../forms/BulkAvailabilityDialog';
import { BulkClearPriceDialog } from '../forms/BulkClearPriceDialog';
import { BulkSetPriceDialog } from '../forms/BulkSetPriceDialog';
import { ManageVisibilityDialog } from '../forms/ManageVisibilityDialog';

interface ListingsTabProps {
  binding: CatalogsBinding;
  catalogId: string;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({ binding, catalogId }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: response, isLoading } = binding.useListingsTable(catalogId);
  const addDialog = useDialog();
  const bulkPriceDialog = useDialog();
  const bulkClearPriceDialog = useDialog();
  const bulkAvailabilityDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = binding.useDeleteListing();
  const bulkRemoveMutation = binding.useBulkRemoveListings();
  // Held while a dialog is open: the selection bar hands its rows to the click, not to the dialog
  const [bulkIds, setBulkIds] = useState<string[]>([]);

  const openBulk = useCallback(
    (which: 'price' | 'clear-price' | 'availability', ids: string[]) => {
      setBulkIds(ids);
      if (which === 'price') bulkPriceDialog.open();
      else if (which === 'clear-price') bulkClearPriceDialog.open();
      else bulkAvailabilityDialog.open();
    },
    [bulkAvailabilityDialog, bulkClearPriceDialog, bulkPriceDialog],
  );

  const handleBulkRemove = useCallback(
    async (ids: string[]) => {
      const ok = await confirm({
        title: `Remove ${pluralize('listing', ids.length, true)}?`,
        description:
          'They are removed from this catalog with their prices, in one go — the variants themselves are untouched.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (ok) bulkRemoveMutation.mutate({ catalogId, ids });
    },
    [bulkRemoveMutation, catalogId, confirm],
  );

  const handleDelete = useCallback(
    async (row: CatalogListingData) => {
      const ok = await confirm({
        title: `Remove "${row.code}"?`,
        description: 'The listing and its prices are removed from this catalog. The variant itself is untouched.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (ok) deleteMutation.mutate({ catalogId, listingId: row.id });
    },
    [catalogId, confirm, deleteMutation],
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
        accessorKey: 'ownerName',
        header: 'Owner',
        cell: ({ row }) => <Badge variant="secondary">{row.original.ownerName}</Badge>,
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
        id: 'pricedIn',
        header: () => <div className="text-center">Priced in</div>,
        cell: ({ row }) => {
          const priced = row.original.prices.length;
          const currencyCount = row.original.currencyCount;
          if (currencyCount === 0) return <div className="text-center">—</div>;
          const label = `${priced} of ${currencyCount} ${pluralize('Currency', currencyCount)}`;
          return (
            <div className="flex justify-center">
              {priced === currencyCount ? (
                <span className="text-sm">{label}</span>
              ) : (
                <Badge variant="warning">{label}</Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'availability',
        header: () => <div className="text-center">Availability</div>,
        cell: ({ row }) => {
          // Takes the wording from the backend and chooses only how loudly to say it
          const { isActive, availability, channelCount, prices } = row.original;
          const blocked = channelCount === 0 || prices.length === 0;
          return (
            <div className="text-center">
              {!isActive ? (
                <Badge variant="destructive">{availability}</Badge>
              ) : blocked ? (
                <Badge variant="warning">{availability}</Badge>
              ) : (
                <span className="text-sm">{availability}</span>
              )}
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
          const actions: RowAction[] = [
            {
              id: 'visibility',
              icon: Radio,
              label: 'Manage Availability',
              permission: binding.permissions.listings.setAvailability,
              dialog: {
                title: 'Manage Availability',
                description: `Where "${r.code}" is available. It is available on every channel this catalog reaches unless excluded here.`,
                content: (close) => (
                  <ManageVisibilityDialog binding={binding} catalogId={catalogId} listing={r} onClose={close} />
                ),
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Remove',
              variant: 'destructive',
              permission: binding.permissions.listings.delete,
              disabled: !r.canDelete,
              onClick: () => handleDelete(r),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [catalogId, handleDelete, binding],
  );

  const { table } = useDataTable({
    columns,
    slug: binding.listingsTableSlug(catalogId),
    label: 'listing',
    serverState: response,
    enableRowSelection: true,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.listingsTableKey(catalogId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={binding.permissions.listings.view}
        searchConfig={{
          columns: [
            { id: 'code', label: 'Code' },
            { id: 'offeringName', label: 'Variant' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="isVariantActive"
            name="isVariantActive"
            label="Variant Status"
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />,
          <SelectFilter
            key="isOfferingActive"
            name="isOfferingActive"
            label="Offering Status"
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />,
        ]}
        toolbarActions={{
          actions: (
            <>
              {/* The wizard is the same write, a whole offering at a time — one variant does not need it */}
              <Button
                size="sm"
                variant="outline"
                startAdornment={<Layers className="size-4" />}
                onClick={() => navigate('new', { relative: 'path' })}
                permission={binding.permissions.listings.add}
              >
                Add Many
              </Button>
              <Button
                size="sm"
                startAdornment={<Plus className="size-4" />}
                onClick={addDialog.open}
                permission={binding.permissions.listings.add}
              >
                Add Listing
              </Button>
            </>
          ),
        }}
        selectActions={(rows) => {
          const ids = rows.map((row) => row.original.id);
          const inherited = rows.filter((row) => !row.original.canDelete).length;
          const currencyCount = rows[0]?.original.currencyCount ?? 0;
          return (
            <>
              <Button
                size="sm"
                variant="outline"
                permission={binding.permissions.prices.set}
                startAdornment={<IndianRupee className="size-4" />}
                disabled={currencyCount === 0}
                disabledTip="This catalog carries no currency yet. Add one on the Currencies tab."
                onClick={() => openBulk('price', ids)}
              >
                Set Price
              </Button>
              <Button
                size="sm"
                variant="outline"
                permission={binding.permissions.listings.setAvailability}
                startAdornment={<Radio className="size-4" />}
                onClick={() => openBulk('availability', ids)}
              >
                Change Availability
              </Button>
              <Button
                size="sm"
                variant="destructive"
                permission={binding.permissions.prices.clear}
                startAdornment={<Eraser className="size-4" />}
                disabled={currencyCount === 0}
                disabledTip="This catalog carries no currency yet, so nothing is priced."
                onClick={() => openBulk('clear-price', ids)}
              >
                Remove Price
              </Button>
              <Button
                size="sm"
                variant="destructive"
                permission={binding.permissions.listings.delete}
                startAdornment={<Trash2 className="size-4" />}
                isLoading={bulkRemoveMutation.isPending}
                disabled={inherited > 0}
                disabledTip={`${pluralize('listing', inherited, true)} in this selection belong to a wider workspace.`}
                onClick={() => handleBulkRemove(ids)}
              >
                Remove
              </Button>
            </>
          );
        }}
        emptyStateConfig={{
          icon: Boxes,
          title: 'Nothing listed yet',
          description: 'Add a variant to this catalog, optionally at one printed MRP, and give it a price.',
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Boxes}
        title="Add Listing"
        description="Pick a variant this catalog should carry. Leave MRP empty to cover any batch, or choose one to list it at a single printed price."
        content={(close) => (
          <AddListingDialog binding={binding} catalogId={catalogId} onSuccess={close} onCancel={close} />
        )}
      />

      <Dialog
        handle={bulkPriceDialog}
        icon={IndianRupee}
        title="Set Price"
        description={`One price for ${pluralize('selected listing', bulkIds.length, true)}. Each one keeps it per currency, and a listing keyed to a printed MRP refuses a price above it.`}
        content={(close) => (
          <BulkSetPriceDialog
            binding={binding}
            catalogId={catalogId}
            ids={bulkIds}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={bulkClearPriceDialog}
        icon={Eraser}
        title="Remove Price"
        description={`Clears one currency's price on ${pluralize('selected listing', bulkIds.length, true)}.`}
        content={(close) => (
          <BulkClearPriceDialog
            binding={binding}
            catalogId={catalogId}
            ids={bulkIds}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={bulkAvailabilityDialog}
        icon={Radio}
        title="Change Availability"
        description={`Where ${pluralize('selected listing', bulkIds.length, true)} should show. They are available on every channel this catalog reaches unless excluded.`}
        content={(close) => (
          <BulkAvailabilityDialog
            binding={binding}
            catalogId={catalogId}
            ids={bulkIds}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
