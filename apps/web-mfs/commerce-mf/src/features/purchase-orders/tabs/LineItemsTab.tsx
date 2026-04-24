import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  PURCHASE_ORDER_ITEMS_TABLE_KEY,
  useAddPurchaseOrderItem,
  usePurchaseOrderItemsTable,
  useRemovePurchaseOrderItem,
} from '@/hooks/purchase-orders';
import type { PurchaseOrderDetail, PurchaseOrderItemData } from '@/schemas/purchase-orders';
import { AddPurchaseOrderItemDialog } from '../forms/AddPurchaseOrderItemDialog';
import { UpdatePurchaseOrderItemDialog } from '../forms/UpdatePurchaseOrderItemDialog';

interface LineItemsTabProps {
  purchaseOrder: PurchaseOrderDetail;
  canModifyItems: boolean;
  existingItemIds: string[];
}

export const LineItemsTab = ({ purchaseOrder, canModifyItems, existingItemIds }: LineItemsTabProps) => {
  const purchaseOrderId = purchaseOrder.id;
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addItemDialog = useDialog();
  const { data: response, isLoading } = usePurchaseOrderItemsTable(purchaseOrderId);
  const addItemMutation = useAddPurchaseOrderItem({
    onSuccess: () => addItemDialog.close(),
  });
  const removeItemMutation = useRemovePurchaseOrderItem();

  const handleRemoveItem = useCallback(
    async (itemId: string, itemName: string) => {
      const confirmed = await confirm({
        title: `Remove "${itemName}"?`,
        description: 'This line item will be removed from the purchase order.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (!confirmed) return;

      removeItemMutation.mutate({
        id: purchaseOrderId,
        itemId,
      });
    },
    [confirm, purchaseOrderId, removeItemMutation],
  );

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
          <span className="font-mono">{`${row.original.unitPrice.currency} ${row.original.unitPrice.value}`}</span>
        ),
      },
      {
        accessorKey: 'totalPrice',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-mono">{`${row.original.totalPrice.currency} ${row.original.totalPrice.value}`}</span>
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
                      id: 'edit',
                      icon: Pencil,
                      label: 'Edit',
                      dialog: {
                        title: 'Update Line Item',
                        description: 'Change quantity and pricing for this line item.',
                        content: (close) => (
                          <UpdatePurchaseOrderItemDialog
                            purchaseOrderId={purchaseOrderId}
                            poCurrencyCode={purchaseOrder.currencyCode}
                            supplierCurrencyCode={purchaseOrder.supplierCurrencyCode ?? purchaseOrder.currencyCode}
                            conversionRate={purchaseOrder.conversionRate}
                            item={row.original}
                            onSuccess={close}
                            onCancel={close}
                          />
                        ),
                      },
                    },
                    {
                      id: 'remove',
                      icon: Trash2,
                      label: 'Remove',
                      variant: 'destructive',
                      onClick: () => handleRemoveItem(row.original.id, row.original.inventoryItemName ?? 'item'),
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
    [canModifyItems, handleRemoveItem, purchaseOrderId, purchaseOrder.conversionRate, purchaseOrder.currencyCode, purchaseOrder.supplierCurrencyCode],
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
    <>
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        toolbarActions={{
          actions: canModifyItems ? (
            <Button size="sm" onClick={addItemDialog.open}>
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

      <Dialog
        handle={addItemDialog}
        title="Add Line Item"
        description="Add an inventory item to this purchase order."
        content={(close) => (
          <AddPurchaseOrderItemDialog
            purchaseOrder={purchaseOrder}
            existingItemIds={existingItemIds}
            mutation={addItemMutation}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
