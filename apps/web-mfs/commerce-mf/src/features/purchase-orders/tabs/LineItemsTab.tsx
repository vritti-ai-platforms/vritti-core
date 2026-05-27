import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  PURCHASE_ORDER_ITEMS_TABLE_KEY,
  usePurchaseOrderItemsTable,
  useRemovePurchaseOrderItem,
} from '@/hooks/purchase-orders';
import type { PurchaseOrderDetail, PurchaseOrderItemData } from '@/schemas/purchase-orders';
import { AddPurchaseOrderItemDialog } from '../forms/AddPurchaseOrderItemDialog';
import { UpdatePurchaseOrderItemDialog } from '../forms/UpdatePurchaseOrderItemDialog';

interface LineItemsTabProps {
  purchaseOrder: PurchaseOrderDetail;
  canModifyItems: boolean;
}

export const LineItemsTab = ({ purchaseOrder, canModifyItems }: LineItemsTabProps) => {
  const purchaseOrderId = purchaseOrder.id;

  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addItemDialog = useDialog();
  const fmt = useFormatters();
  const { data: response, isLoading } = usePurchaseOrderItemsTable(purchaseOrderId);
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
        accessorKey: 'uomQty',
        header: 'Quantity',
        cell: ({ row }) => {
          const { uomQty, primaryUomQty, orderUomSymbol, primaryUomSymbol } = row.original;
          const isCrossUom = primaryUomQty !== uomQty;
          return (
            <span className="font-mono">
              <NumberCell value={uomQty} /> {orderUomSymbol}
              {isCrossUom && (
                <span className="text-xs text-muted-foreground">
                  {' ('}
                  <NumberCell value={primaryUomQty} /> {primaryUomSymbol})
                </span>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: 'receivedQuantity',
        header: 'Received',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.receivedQuantity} /> {row.original.orderUomSymbol}
          </span>
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => {
          const { unitPrice, primaryUomUnitPrice, uomQty, primaryUomQty, primaryUomSymbol } = row.original;
          const isCrossUom = primaryUomQty !== uomQty;
          return (
            <span className="font-mono">
              {fmt.currency(unitPrice).primary}
              {isCrossUom && (
                <span className="text-xs text-muted-foreground">
                  {` (${fmt.currency(primaryUomUnitPrice).primary}${primaryUomSymbol ? ` / ${primaryUomSymbol}` : ''})`}
                </span>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalPrice',
        header: 'Total',
        cell: ({ row }) => <CurrencyCell value={row.original.totalPrice} />,
      },
      ...(canModifyItems
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => {
                const isReceived = row.original.receivedQuantity > 0;
                return (
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
                              item={row.original}
                              onSuccess={close}
                              onCancel={close}
                            />
                          ),
                        },
                      },
                      ...(isReceived
                        ? []
                        : [
                            {
                              id: 'remove',
                              icon: Trash2,
                              label: 'Remove',
                              variant: 'destructive' as const,
                              onClick: () =>
                                handleRemoveItem(row.original.id, row.original.inventoryItemName ?? 'item'),
                            },
                          ]),
                    ]}
                  />
                );
              },
              enableSorting: false,
              enableHiding: false,
            } as ColumnDef<PurchaseOrderItemData>,
          ]
        : []),
    ],
    [canModifyItems, handleRemoveItem, purchaseOrderId, purchaseOrder.currencyCode, fmt],
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
        mode="tab"
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
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
