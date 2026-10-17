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
import { Boxes, Plus, Radio, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type { CatalogListingData } from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';
import { AddListingDialog } from '../forms/AddListingDialog';
import { ManageVisibilityDialog } from '../forms/ManageVisibilityDialog';

interface ListingsTabProps {
  binding: CatalogsBinding;
  catalogId: string;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({ binding, catalogId }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = binding.useListingsTable(catalogId);
  const { data: channels = [] } = binding.useChannelsForCatalog(catalogId);
  const { data: currencies = [] } = binding.useCurrencies(catalogId);
  const addDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = binding.useDeleteListing();

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

  const currencyCount = currencies.length;
  const columns = useMemo<ColumnDef<CatalogListingData>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <StringCell value={row.original.code} mono />,
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
        id: 'priced',
        header: () => <div className="text-center">Priced</div>,
        cell: ({ row }) => {
          // Prices themselves live on the Prices tab; this only says whether every currency has one.
          // The backend already resolved one price per currency — its own or an inherited one — so
          // counting the rows is counting the currencies this workspace can actually quote in.
          const priced = row.original.prices.length;
          if (currencyCount === 0) return <div className="text-center">—</div>;
          return (
            <div className="flex justify-center">
              {priced === currencyCount ? (
                <span className="text-sm">{`${priced} of ${currencyCount}`}</span>
              ) : (
                <Badge variant="warning">{`${priced} of ${currencyCount}`}</Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'channels',
        header: () => <div className="text-center">Available on</div>,
        cell: ({ row }) => {
          const excluded = row.original.excludedChannelIds.length;
          // A listing nobody priced is available nowhere, whatever the channels say — the storefront
          // resolves a price before it returns a row, so counting channels alone overstates it
          const priced = row.original.prices.length > 0;
          return (
            <div className="text-center">
              {channels.length === 0 ? (
                <Badge variant="warning">No channels</Badge>
              ) : priced ? (
                <span className="text-sm">{`${channels.length - excluded} of ${channels.length}`}</span>
              ) : (
                <Badge variant="warning">Not priced</Badge>
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
              permission: binding.permissions.listings.edit,
              dialog: {
                title: 'Manage Availability',
                description: `Where "${r.variantName}" is available. It is available on every channel this catalog reaches unless excluded here.`,
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
    [catalogId, channels, currencyCount, handleDelete, binding],
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
        searchConfig={{ columns: [{ id: 'code', label: 'Code' }], searchAll: true }}
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
        description="Pick a variant. Leave MRP empty to cover any batch, or choose one to list this variant at a single printed price."
        content={(close) => (
          <AddListingDialog binding={binding} catalogId={catalogId} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
