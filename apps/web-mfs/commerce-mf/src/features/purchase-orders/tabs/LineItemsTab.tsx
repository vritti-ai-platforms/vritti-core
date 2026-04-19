import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Boxes, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { PURCHASE_ORDER_ITEMS_TABLE_KEY, usePurchaseOrderItemsTable } from '@/hooks/purchase-orders';
import type { PurchaseOrderItemData } from '@/schemas/purchase-orders';

interface LineItemsTabProps {
  purchaseOrderId: string;
  canModifyItems: boolean;
  onOpenAddItemDialog: () => void;
  onRemoveItem: (inventoryItemId: string, itemName: string) => void;
}

export const LineItemsTab = ({
  purchaseOrderId,
  canModifyItems,
  onOpenAddItemDialog,
  onRemoveItem,
}: LineItemsTabProps) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = usePurchaseOrderItemsTable(purchaseOrderId);

  const columns = useMemo<ColumnDef<PurchaseOrderItemData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.inventoryItemName ?? row.original.inventoryItemId}</span>
        ),
      },
      {
        accessorKey: 'orderedQuantity',
        header: 'Ordered',
        cell: ({ row }) => <span className="font-mono">{row.original.orderedQuantity}</span>,
      },
      {
        accessorKey: 'receivedQuantity',
        header: 'Received',
        cell: ({ row }) => <span className="font-mono">{row.original.receivedQuantity}</span>,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => (
          <span className="font-mono">{row.original.unitPrice != null ? row.original.unitPrice.toFixed(2) : '—'}</span>
        ),
      },
      {
        accessorKey: 'totalPrice',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.totalPrice != null ? row.original.totalPrice.toFixed(2) : '—'}
          </span>
        ),
      },
      ...(canModifyItems
        ? [
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
                      onClick: () =>
                        onRemoveItem(row.original.inventoryItemId, row.original.inventoryItemName ?? 'item'),
                    },
                  ]}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } as ColumnDef<PurchaseOrderItemData>,
          ]
        : []),
    ],
    [canModifyItems, onRemoveItem],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-purchase-order-${purchaseOrderId}-items`,
    label: 'line item',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: PURCHASE_ORDER_ITEMS_TABLE_KEY(purchaseOrderId) }),
  });

  return (
    <DataTable
      table={table}
      mode="compact"
      isLoading={isLoading}
      toolbarActions={{
        actions: canModifyItems ? (
          <Button size="sm" onClick={onOpenAddItemDialog}>
            <Plus className="mr-2 size-4" />
            Add Line Item
          </Button>
        ) : undefined,
      }}
      emptyStateConfig={{
        icon: Boxes,
        title: 'No line items',
        description: canModifyItems
          ? 'No line items added yet. Use "Add Line Item" to get started.'
          : 'No line items found for this purchase order.',
      }}
    />
  );
};
