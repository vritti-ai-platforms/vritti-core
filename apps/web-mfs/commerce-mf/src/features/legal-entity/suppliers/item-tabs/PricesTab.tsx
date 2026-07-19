import { useQueryClient } from '@tanstack/react-query';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
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
  SUPPLIER_ITEM_PRICES_TABLE_KEY,
  useDeleteSupplierItemPrice,
  useSupplierItemPricesTable,
} from '@/hooks/legal-entity/suppliers';
import { PRICE_SOURCE_LABELS, type SupplierItemPriceRow } from '@/schemas/suppliers';
import { AddSupplierItemPriceDialog } from '../forms/AddSupplierItemPriceDialog';
import { EditSupplierItemPriceDialog } from '../forms/EditSupplierItemPriceDialog';

interface PricesTabProps {
  supplierId: string;
  itemId: string;
  currencyCode?: string;
}

export const PricesTab: React.FC<PricesTabProps> = ({ supplierId, itemId, currencyCode }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = useSupplierItemPricesTable(supplierId, itemId);
  const deleteMutation = useDeleteSupplierItemPrice(supplierId, itemId);

  const handleDelete = useCallback(
    async (row: SupplierItemPriceRow) => {
      const confirmed = await confirm({
        title: 'Delete price record?',
        description: 'Deleting the newest record re-opens the previous one when the windows are contiguous.',
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
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: LE_SUPPLIERS.prices.edit,
                dialog: {
                  title: 'Edit Price',
                  description: 'Update this price record.',
                  content: (close) => (
                    <EditSupplierItemPriceDialog
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
                permission: LE_SUPPLIERS.prices.delete,
                onClick: () => handleDelete(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [supplierId, itemId, currencyCode, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-supplier-item-${itemId}-prices`,
    label: 'price record',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={LE_SUPPLIERS.prices.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={LE_SUPPLIERS.prices.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Price
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: CalendarClock,
          title: 'No price records',
          description: 'Add a price to start the validity-dated timeline for this item.',
          action: (
            <Button
              permission={LE_SUPPLIERS.prices.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Price
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={CalendarClock}
        title="Add Price"
        description="Add a validity-dated price to this item's timeline."
        content={(close) => (
          <AddSupplierItemPriceDialog
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
