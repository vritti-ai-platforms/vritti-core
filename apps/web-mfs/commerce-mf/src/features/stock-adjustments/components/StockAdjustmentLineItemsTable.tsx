import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY,
  useRemoveStockAdjustmentLineItem,
  useStockAdjustmentLineItemsTable,
} from '@/hooks/stock-adjustments';
import type { StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import { AddLineItemDialogForm } from '../forms/AddLineItemDialogForm';
import { EditLineItemDialogForm } from '../forms/EditLineItemDialogForm';

interface StockAdjustmentLineItemsTableProps {
  adjustmentId: string;
  lineId: string;
  isDraft: boolean;
}

export const StockAdjustmentLineItemsTable = ({ adjustmentId, lineId, isDraft }: StockAdjustmentLineItemsTableProps) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addLineItemDialog = useDialog();
  const editLineItemDialog = useDialog();
  const [editingItem, setEditingItem] = useState<StockAdjustmentLineItemData | null>(null);

  const { data: lineItemsResponse, isLoading: isLoadingLineItems } = useStockAdjustmentLineItemsTable(adjustmentId, lineId);
  const removeLineItemMutation = useRemoveStockAdjustmentLineItem(adjustmentId, lineId);
  const isDeletingLineItem = removeLineItemMutation.isPending;

  const handleRemoveLineItem = useCallback(
    async (itemId: string) => {
      const confirmed = await confirm({
        title: 'Remove this line item?',
        description: 'This line item will be removed.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeLineItemMutation.mutate(itemId);
    },
    [confirm, removeLineItemMutation],
  );

  const lineItemColumns = useMemo<ColumnDef<StockAdjustmentLineItemData>[]>(
    () => [
      {
        accessorKey: 'quantity',
        header: 'Quantity',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            disabledAll={isDeletingLineItem}
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                hidden: !isDraft,
                onClick: () => {
                  setEditingItem(row.original);
                  editLineItemDialog.open();
                },
              },
              {
                id: 'delete',
                icon: Trash2,
                label: 'Delete',
                variant: 'destructive',
                hidden: !isDraft,
                onClick: () => handleRemoveLineItem(row.original.id),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [editLineItemDialog, handleRemoveLineItem, isDeletingLineItem, isDraft],
  );

  const { table } = useDataTable({
    columns: lineItemColumns,
    serverState: lineItemsResponse,
    slug: `stock-adjustment-${adjustmentId}-line-${lineId}-items`,
    label: 'line item',
    enableRowSelection: false,
    onStatePush: () => {
      queryClient.invalidateQueries({
        queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustmentId, lineId),
      });
    },
  });

  return (
    <>
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoadingLineItems}
        toolbarActions={{
          actions: isDraft ? (
            <Button size="sm" onClick={addLineItemDialog.open} startAdornment={<Plus className="size-4" />}>
              Add Line Item
            </Button>
          ) : undefined,
        }}
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No line items',
          description: 'Add line items. Their sum must match line quantity to publish.',
        }}
      />

      <Dialog
        handle={addLineItemDialog}
        title="Add Line Item"
        description="Add a quantity entry for this line."
        content={(close) => (
          <AddLineItemDialogForm adjustmentId={adjustmentId} lineId={lineId} onSuccess={close} onCancel={close} />
        )}
      />

      {editingItem && (
        <Dialog
          handle={editLineItemDialog}
          title="Edit Line Item"
          description="Update this line item quantity."
          content={(close) => (
            <EditLineItemDialogForm
              adjustmentId={adjustmentId}
              lineId={lineId}
              itemId={editingItem.id}
              defaultQuantity={editingItem.quantity}
              onSuccess={() => {
                setEditingItem(null);
                close();
              }}
              onCancel={() => {
                setEditingItem(null);
                close();
              }}
            />
          )}
        />
      )}
    </>
  );
};
