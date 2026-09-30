import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Boxes, IndianRupee, Plus, Radio, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type { CatalogListingData } from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';
import { AddListingDialog } from '../forms/AddListingDialog';
import { ManageVisibilityDialog } from '../forms/ManageVisibilityDialog';
import { SetListingPriceDialog } from '../forms/SetListingPriceDialog';

interface ListingsTabProps {
  binding: CatalogsBinding;
  catalogId: string;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({ binding, catalogId }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = binding.useListingsTable(catalogId);
  const { data: channels = [] } = binding.useChannelsForCatalog(catalogId);
  const addDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = binding.useDeleteListing();

  const handleDelete = useCallback(
    async (row: CatalogListingData) => {
      const ok = await confirm({
        title: `Remove "${row.sku ?? 'this listing'}"?`,
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
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => <StringCell value={row.original.sku} mono />,
        enableSorting: true,
      },
      { accessorKey: 'variantName', header: 'Variant', enableSorting: false },
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
        id: 'price',
        header: () => <div className="text-center">Price</div>,
        cell: ({ row }) => {
          const price = row.original.prices.find((entry) => entry.siteId === null) ?? row.original.prices[0];
          return (
            <div className="flex justify-center">
              {price ? <CurrencyCell value={price.price} /> : <Badge variant="warning">Not priced</Badge>}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'channels',
        header: () => <div className="text-center">Sells on</div>,
        cell: ({ row }) => {
          const hidden = row.original.hiddenChannelIds.length;
          return (
            <div className="text-center">
              {channels.length === 0 ? (
                <Badge variant="warning">No channels</Badge>
              ) : (
                <span className="text-sm">{`${channels.length - hidden} of ${channels.length}`}</span>
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
              id: 'price',
              icon: IndianRupee,
              label: 'Set Price',
              permission: binding.permissions.listings.edit,
              // Reach lets this workspace see a wider scope's listing; only its owner may price it
              disabled: !r.canEdit,
              dialog: {
                title: 'Set Price',
                description: r.mrp
                  ? 'This listing is keyed to a printed MRP and cannot be priced above it.'
                  : 'This listing sells any batch, so billing caps the price at each pack’s printed MRP.',
                content: (close) => (
                  <SetListingPriceDialog
                    binding={binding}
                    catalogId={catalogId}
                    listing={r}
                    onSuccess={close}
                    onCancel={close}
                  />
                ),
              },
            },
            {
              id: 'visibility',
              icon: Radio,
              label: 'Manage Visibility',
              permission: binding.permissions.listings.edit,
              dialog: {
                title: 'Manage Visibility',
                description: `Which channels sell "${r.variantName ?? r.sku ?? 'this listing'}". It sells everywhere this catalog reaches unless switched off.`,
                content: (close) => (
                  <ManageVisibilityDialog
                    binding={binding}
                    catalogId={catalogId}
                    listing={r}
                    channels={channels}
                    onClose={close}
                  />
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
    [catalogId, channels, handleDelete, binding],
  );

  const { table } = useDataTable({
    columns,
    slug: binding.listingsTableSlug(catalogId),
    label: 'listing',
    serverState: response,
    enableRowSelection: false,
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
        searchConfig={{ columns: [{ id: 'sku', label: 'SKU' }], searchAll: true }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={binding.permissions.listings.add}
            >
              Add Listing
            </Button>
          ),
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
        description="Pick a variant. Leave MRP empty to sell any batch, or choose one to list this variant at a single printed price."
        content={(close) => (
          <AddListingDialog binding={binding} catalogId={catalogId} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
