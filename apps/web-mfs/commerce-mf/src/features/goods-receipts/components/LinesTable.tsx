import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  GOODS_RECEIPT_LINES_BY_LOT_TABLE_KEY,
  GOODS_RECEIPT_LINES_TABLE_KEY,
  useGoodsReceiptLinesByLotTable,
  useGoodsReceiptLinesTable,
  useRemoveGoodsReceiptLine,
} from '@/hooks/goods-receipts';
import {
  type GoodsReceiptLineData,
  type InventoryTracking,
  InventoryTrackingValues,
} from '@/schemas/goods-receipts';
import { AddLineForm } from '../forms/AddLineForm';
import { EditLineForm } from '../forms/EditLineForm';

type LinesScope = { kind: 'item'; itemId: string } | { kind: 'lot'; itemId: string; lotId: string };

interface LinesTableProps {
  goodsReceiptId: string;
  scope: LinesScope;
  tracking: InventoryTracking;
  isDraft: boolean;
  uomSymbol: string | null;
  poRemainingQuantity: number | null;
  selectedLineId?: string | null;
  onSelectLine?: (lineId: string | null) => void;
}

// One DataTable for lines, scoped either by item (when an item is selected and tracking='quantity')
// or by lot (when a lot is selected). Same columns; the data hook is the only difference.
export const LinesTable = ({
  goodsReceiptId,
  scope,
  tracking,
  isDraft,
  uomSymbol,
  poRemainingQuantity,
  selectedLineId,
  onSelectLine,
}: LinesTableProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addLineDialog = useDialog();

  const lotId = scope.kind === 'lot' ? scope.lotId : null;

  const itemTable = useGoodsReceiptLinesTable(goodsReceiptId, scope.kind === 'item' ? scope.itemId : null);
  const lotTable = useGoodsReceiptLinesByLotTable(goodsReceiptId, scope.itemId, lotId);
  const { data: response, isLoading } = scope.kind === 'item' ? itemTable : lotTable;

  const removeLineMutation = useRemoveGoodsReceiptLine(goodsReceiptId, scope.itemId);

  const isSerial = tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;

  const handleRemoveLine = useCallback(
    async (line: GoodsReceiptLineData) => {
      const confirmed = await confirm({
        title: 'Remove this line?',
        description: 'This line and any serials added under it will be removed.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) {
        removeLineMutation.mutate(line.id, {
          onSuccess: () => {
            if (selectedLineId === line.id) onSelectLine?.(null);
          },
        });
      }
    },
    [confirm, removeLineMutation, selectedLineId, onSelectLine],
  );

  const columns = useMemo<ColumnDef<GoodsReceiptLineData>[]>(
    () => [
      {
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) => row.original.locationName ?? row.original.locationId ?? '—',
        enableSorting: true,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.quantity} {uomSymbol ?? ''}
          </span>
        ),
        enableSorting: true,
      },
      ...(isSerial
        ? [
            {
              id: 'serials',
              header: 'Serials',
              cell: ({ row }) => (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    row.original.isBalanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                  }`}
                >
                  {row.original.lineItemsCount}/{row.original.quantity}
                </span>
              ),
            } satisfies ColumnDef<GoodsReceiptLineData>,
          ]
        : []),
      ...(isDraft
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
                        title: 'Edit Line',
                        description: 'Update the storage location or quantity for this line.',
                        content: (close) => (
                          <EditLineForm
                            goodsReceiptId={goodsReceiptId}
                            itemId={scope.itemId}
                            line={row.original}
                            tracking={tracking}
                            onSuccess={close}
                            onCancel={close}
                          />
                        ),
                      },
                    },
                    {
                      id: 'delete',
                      icon: Trash2,
                      label: 'Remove',
                      variant: 'destructive',
                      onClick: () => handleRemoveLine(row.original),
                    },
                  ]}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } satisfies ColumnDef<GoodsReceiptLineData>,
          ]
        : []),
    ],
    [isDraft, isSerial, tracking, uomSymbol, scope.itemId, goodsReceiptId, handleRemoveLine],
  );

  const slug =
    scope.kind === 'lot'
      ? `gr-${goodsReceiptId}-item-${scope.itemId}-lot-${scope.lotId}-lines`
      : `gr-${goodsReceiptId}-item-${scope.itemId}-lines`;

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug,
    label: 'line',
    enableRowSelection: false,
    onStatePush: () => {
      if (scope.kind === 'lot') {
        queryClient.invalidateQueries({
          queryKey: GOODS_RECEIPT_LINES_BY_LOT_TABLE_KEY(goodsReceiptId, scope.itemId, scope.lotId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_LINES_TABLE_KEY(goodsReceiptId, scope.itemId) });
      }
    },
  });

  return (
    <div className="space-y-3">
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        onRowClick={onSelectLine ? (row) => onSelectLine(row.id) : undefined}
        selectedRowId={selectedLineId ?? null}
        toolbarActions={
          isDraft
            ? {
                actions: (
                  <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addLineDialog.open}>
                    Add Line
                  </Button>
                ),
              }
            : undefined
        }
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No lines yet',
          description:
            tracking === InventoryTrackingValues.QUANTITY || tracking === InventoryTrackingValues.SERIAL
              ? 'Distribute the received quantity across storage locations.'
              : 'Add a line to start receiving stock under this lot.',
          action: isDraft ? (
            <Button startAdornment={<Plus className="size-4" />} onClick={addLineDialog.open}>
              Add Line
            </Button>
          ) : undefined,
        }}
      />

      <Dialog
        handle={addLineDialog}
        title="Add Line"
        description={
          isSerial
            ? 'Pick a storage location for this line. Quantity is derived from the serials you add.'
            : 'Distribute the received stock across a storage location.'
        }
        content={(close) => (
          <AddLineForm
            goodsReceiptId={goodsReceiptId}
            itemId={scope.itemId}
            goodsReceiptLotId={lotId}
            tracking={tracking}
            poRemainingQuantity={poRemainingQuantity}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      {!response && !isLoading && (
        <Empty icon={<ClipboardList />} title="No lines" description="Nothing to show yet." />
      )}
    </div>
  );
};
