import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { GOODS_RECEIPT_ITEMS_TABLE_KEY } from '@/hooks/goods-receipts/keys';
import { useGoodsReceiptItemsTable } from '@/hooks/goods-receipts/useGoodsReceiptLinesTable';
import { useRemoveGoodsReceiptItem } from '@/hooks/goods-receipts/useRemoveGoodsReceiptLine';
import type { GoodsReceiptData, GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { AddLineForm } from '../forms/AddLineDialog';
import { EditLineForm } from '../forms/EditLineDialog';

export const GoodsReceiptItems = ({
  id,
  receipt,
  existingInventoryItemIds,
}: {
  id: string;
  receipt: GoodsReceiptData;
  existingInventoryItemIds: string[];
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addLineDialog = useDialog();
  const { data, isLoading } = useGoodsReceiptItemsTable(id);
  const removeLineMutation = useRemoveGoodsReceiptItem(id);

  const handleRemoveLine = useCallback(
    async (lineId: string) => {
      const confirmed = await confirm({
        title: 'Remove this line?',
        description: 'This line will be removed.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeLineMutation.mutate(lineId);
    },
    [confirm, removeLineMutation],
  );

  const lineColumns = useMemo<ColumnDef<GoodsReceiptItemData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Item',
        cell: ({ row }) => row.original.inventoryItemName,
      },
      {
        accessorKey: 'acceptedQuantity',
        header: 'Accepted',
      },
      {
        accessorKey: 'rejectedQuantity',
        header: 'Rejected',
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => Number(row.original.acceptedQuantity) + Number(row.original.rejectedQuantity),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            disabledAll={removeLineMutation.isPending}
            actions={[
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                dialog: {
                  title: 'Edit Line',
                  description: 'Update accepted and rejected quantities for this item.',
                  content: (close) => (
                    <EditLineForm receiptId={id} item={row.original} onSuccess={close} onCancel={close} />
                  ),
                },
              },
              {
                id: 'remove',
                icon: Trash2,
                label: 'Remove',
                variant: 'destructive',
                onClick: () => handleRemoveLine(row.original.id),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [id, handleRemoveLine, removeLineMutation.isPending],
  );

  const { table } = useDataTable({
    columns: lineColumns,
    serverState: data,
    slug: `goods-receipt-${id}-items`,
    label: 'receipt item',
    enableRowSelection: false,
    onStatePush: () => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_ITEMS_TABLE_KEY(id) });
    },
  });

  return (
    <div>
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={addLineDialog.open} startAdornment={<Plus className="size-4" />}>
              Add Item
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No items added',
          description: 'Add at least one inventory item to proceed to allocation.',
        }}
      />

      <Dialog
        handle={addLineDialog}
        title="Add Line"
        content={(close) => (
          <AddLineForm
            id={id}
            receipt={receipt}
            existingInventoryItemIds={existingInventoryItemIds}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
