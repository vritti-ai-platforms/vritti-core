import { useQueryClient } from '@tanstack/react-query';
import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
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
import { Boxes, IndianRupee, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { StatusSwitch } from '@/components/StatusSwitch';
import { useCatalogChannelsForCatalog } from '@/hooks/organization/catalog-channels';
import {
  CATALOG_LISTINGS_TABLE_KEY,
  useCatalogListingsTable,
  useDeleteCatalogListing,
  useSetCatalogListingStatus,
} from '@/hooks/organization/catalogs';
import type { CatalogListingData } from '@/schemas/catalogs';
import { ChannelVisibilityChips } from '../components/ChannelVisibilityChips';
import { AddListingDialog } from '../forms/AddListingDialog';
import { SetListingPriceDialog } from '../forms/SetListingPriceDialog';

interface ListingsTabProps {
  catalogId: string;
}

export const ListingsTab: React.FC<ListingsTabProps> = ({ catalogId }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useCatalogListingsTable(catalogId);
  const { data: channels = [] } = useCatalogChannelsForCatalog(catalogId);
  const addDialog = useDialog();
  const confirm = useConfirm();
  const deleteMutation = useDeleteCatalogListing();
  const statusMutation = useSetCatalogListingStatus();

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
        header: 'Sells on',
        cell: ({ row }) => (
          <ChannelVisibilityChips
            catalogId={catalogId}
            listingId={row.original.id}
            channels={channels}
            hiddenChannelIds={row.original.hiddenChannelIds}
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'isActive',
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusSwitch
              checked={row.original.isActive}
              permission={ORG_CATALOGS.listings.edit}
              disabled={statusMutation.isPending}
              onCheckedChange={(isActive) => statusMutation.mutate({ catalogId, listingId: row.original.id, isActive })}
              ariaLabel={`Mark ${row.original.sku ?? 'listing'} active`}
            />
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
              id: 'price',
              icon: IndianRupee,
              label: 'Set Price',
              permission: ORG_CATALOGS.listings.edit,
              dialog: {
                title: 'Set Price',
                description: r.mrp
                  ? 'This listing is keyed to a printed MRP and cannot be priced above it.'
                  : 'This listing sells any batch, so billing caps the price at each pack’s printed MRP.',
                content: (close) => (
                  <SetListingPriceDialog catalogId={catalogId} listing={r} onSuccess={close} onCancel={close} />
                ),
              },
            },
            {
              id: 'delete',
              icon: Trash2,
              label: 'Remove',
              variant: 'destructive',
              permission: ORG_CATALOGS.listings.delete,
              onClick: () => handleDelete(r),
            },
          ];
          return <RowActions actions={actions} />;
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [catalogId, channels, handleDelete, statusMutation],
  );

  const { table } = useDataTable({
    columns,
    slug: `commerce-org-catalog-${catalogId}-listings`,
    label: 'listing',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: CATALOG_LISTINGS_TABLE_KEY(catalogId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={ORG_CATALOGS.listings.view}
        searchConfig={{ columns: [{ id: 'sku', label: 'SKU' }], searchAll: true }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
              permission={ORG_CATALOGS.listings.add}
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
        content={(close) => <AddListingDialog catalogId={catalogId} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
