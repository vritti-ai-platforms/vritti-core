import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { CartLineData } from '@/schemas/carts';
import { AddCartLineDialog } from '../forms/AddCartLineDialog';
import type { CartsBinding } from '../types';

interface ItemsTabProps {
  binding: CartsBinding;
  cartId: string;
  partyId: string;
}

export const ItemsTab: React.FC<ItemsTabProps> = ({ binding, cartId, partyId }) => {
  const { permissions } = binding;
  const queryClient = useQueryClient();
  const { data: response, isLoading } = binding.useCartItemsTable(cartId);
  const confirm = useConfirm();
  const addDialog = useDialog();
  const removeMutation = binding.useRemoveCartLine(cartId);

  const handleRemove = useCallback(
    async (row: CartLineData) => {
      const confirmed = await confirm({
        title: 'Remove item?',
        description: `Remove "${row.name}" from this basket?`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeMutation.mutate({ offeringVariantId: row.offeringVariantId, partyId });
    },
    [confirm, removeMutation, partyId],
  );

  const columns = useMemo<ColumnDef<CartLineData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        enableSorting: true,
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => <StringCell value={row.original.sku} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => <NumberCell value={row.original.quantity} />,
        enableSorting: true,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit price',
        cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
        enableSorting: false,
      },
      {
        accessorKey: 'lineTotal',
        header: 'Total',
        cell: ({ row }) => <CurrencyCell value={row.original.lineTotal} />,
        enableSorting: false,
      },
      {
        accessorKey: 'isAvailable',
        header: 'Status',
        // An item this workspace has stopped pricing stays in the basket and says so — dropping it
        // silently would lose what the shopper chose.
        cell: ({ row }) =>
          row.original.isAvailable ? (
            <Badge variant="success">Available</Badge>
          ) : (
            <Badge variant="outline">Unavailable</Badge>
          ),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'remove',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                permission: permissions.delete,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleRemove, permissions],
  );

  const { table } = useDataTable({
    columns,
    slug: binding.itemsTableSlug(cartId),
    label: 'item',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.itemsTableKey(cartId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={permissions.view}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Product' },
            { id: 'sku', label: 'SKU' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={permissions.add}
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Item
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ShoppingCart,
          title: 'No items',
          description: 'Nothing has been added to this basket yet.',
          action: (
            <Button permission={permissions.add} startAdornment={<Plus className="size-4" />} onClick={addDialog.open}>
              Add Item
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={Plus}
        title="Add Item"
        description={`Whatever this ${binding.scopeNoun} sells can be added. A product it does not price yet is added anyway, and the item says so.`}
        content={(close) => (
          <AddCartLineDialog binding={binding} cartId={cartId} partyId={partyId} onSuccess={close} onCancel={close} />
        )}
      />
    </>
  );
};
