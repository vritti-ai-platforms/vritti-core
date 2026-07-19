import { useQueryClient } from '@tanstack/react-query';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateCell,
  DateTimeCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY,
  useDeleteSiteSupplierItemPrice,
  useSiteSupplierItemPricesTable,
} from '@/hooks/site/suppliers';
import { PRICE_SOURCE_LABELS, type SupplierItemPriceRow } from '@/schemas/suppliers';
import { AddSitePriceDialog } from '../forms/AddSitePriceDialog';
import { EditSitePriceDialog } from '../forms/EditSitePriceDialog';

interface PricesTabProps {
  supplierId: string;
  itemId: string;
  currencyCode?: string;
}

export const PricesTab: React.FC<PricesTabProps> = ({ supplierId, itemId, currencyCode }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useSiteSupplierItemPricesTable(supplierId, itemId);
  const deleteMutation = useDeleteSiteSupplierItemPrice(supplierId, itemId);

  const handleDelete = useCallback(
    async (row: SupplierItemPriceRow) => {
      const confirmed = await confirm({
        title: 'Delete site price?',
        description: 'This removes the site-specific price; the general price applies again.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<SupplierItemPriceRow>[]>(
    () => [
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
      },
      {
        accessorKey: 'scope',
        header: 'Scope',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.siteId ? (
            <Badge variant="secondary">Site-specific</Badge>
          ) : (
            <Badge variant="outline">General</Badge>
          ),
      },
      {
        accessorKey: 'scheme',
        header: 'Scheme',
        enableSorting: false,
        cell: ({ row }) => {
          const { schemeBuyQty, schemeFreeQty } = row.original;
          return schemeBuyQty && schemeFreeQty ? (
            <span className="font-mono">
              {schemeBuyQty}+{schemeFreeQty}
            </span>
          ) : (
            'None'
          );
        },
      },
      {
        accessorKey: 'validFrom',
        header: 'Valid From',
        cell: ({ row }) => <DateCell value={row.original.validFrom} />,
      },
      {
        accessorKey: 'validTo',
        header: 'Valid To',
        cell: ({ row }) =>
          row.original.validTo ? (
            <DateCell value={row.original.validTo} />
          ) : (
            <Badge variant="outline">Open-ended</Badge>
          ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => <Badge variant="secondary">{PRICE_SOURCE_LABELS[row.original.source]}</Badge>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) =>
          row.original.siteId ? (
            <RowActions
              actions={[
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  permission: SITE_SUPPLIERS.prices.edit,
                  dialog: {
                    title: 'Edit Site Price',
                    description: 'Update this site-specific price record.',
                    content: (close) => (
                      <EditSitePriceDialog
                        supplierId={supplierId}
                        itemId={itemId}
                        currencyCode={currencyCode}
                        price={row.original}
                        onSuccess={close}
                        onCancel={close}
                      />
                    ),
                  },
                },
                {
                  id: 'delete',
                  icon: Trash2,
                  label: 'Delete',
                  variant: 'destructive',
                  permission: SITE_SUPPLIERS.prices.delete,
                  onClick: () => handleDelete(row.original),
                },
              ]}
            />
          ) : null,
      },
    ],
    [supplierId, itemId, currencyCode, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-site-supplier-item-${itemId}-prices`,
    label: 'price record',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () =>
      queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={SITE_SUPPLIERS.prices.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={SITE_SUPPLIERS.prices.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Site Price
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: CalendarClock,
          title: 'No prices',
          description: 'No general or site-specific prices apply to this item yet.',
          action: (
            <Button
              permission={SITE_SUPPLIERS.prices.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Site Price
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={CalendarClock}
        title="Add Site Price"
        description="Add a site-specific price for this item at your site."
        content={(close) => (
          <AddSitePriceDialog
            supplierId={supplierId}
            itemId={itemId}
            currencyCode={currencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
