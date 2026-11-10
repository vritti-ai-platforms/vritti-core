import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ClipboardList, Eye, PackageCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { GoodsReceiptLineData } from '@/schemas/goods-receipts';
import { type InventoryTracking, InventoryTrackingValues } from '@/schemas/inventory-items';
import type { GoodsReceiptsBinding } from '../../bindings';
import { AddLineForm } from './forms/AddLineForm';
import { EditLineForm } from './forms/EditLineForm';

type LinesScope =
  | { kind: 'item'; itemId: string; inventoryItemId: string }
  | { kind: 'lot'; itemId: string; inventoryItemId: string; lotId: string };

interface LinesTableProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  scope: LinesScope;
  tracking: InventoryTracking;
  isDraft: boolean;
  uomSymbol: string;
  allowDecimal: boolean;
  undistributedQty: number;
  onSelectLine?: (lineId: string | null) => void;
}

// The lines an item's or a lot's accepted quantity is put away in; serial-tracked lines open their serials, others are
// edited in place
export const LinesTable: React.FC<LinesTableProps> = ({
  binding,
  goodsReceiptId,
  scope,
  tracking,
  isDraft,
  uomSymbol,
  allowDecimal,
  undistributedQty,
  onSelectLine,
}) => {
  const { permissions } = binding;
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addLineDialog = useDialog();
  const lotId = scope.kind === 'lot' ? scope.lotId : null;

  const itemLines = binding.useLinesTable(goodsReceiptId, scope.kind === 'item' ? scope.itemId : null);
  const lotLines = binding.useLotLinesTable(goodsReceiptId, scope.itemId, lotId);
  const linesTableQuery = scope.kind === 'item' ? itemLines : lotLines;
  const removeLineMutation = binding.useRemoveLine(goodsReceiptId, scope.itemId);

  const isSerialTracked =
    tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;

  // Confirms and removes a line with its serials
  const handleRemoveLine = useCallback(
    async (line: GoodsReceiptLineData) => {
      const location = line.locationName ?? 'this location';
      const confirmed = await confirm({
        title: `Remove the line at ${location}?`,
        description: `The line at ${location} and any serials added under it will be removed.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeLineMutation.mutate(line.id);
    },
    [confirm, removeLineMutation],
  );

  const columns = useMemo<ColumnDef<GoodsReceiptLineData>[]>(
    () => [
      {
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) => <StringCell value={row.original.locationName} />,
        enableSorting: true,
      },
      {
        accessorKey: 'locationPath',
        header: 'Path',
        cell: ({ row }) => <StringCell value={row.original.locationPath} className="text-xs text-muted-foreground" />,
        enableSorting: false,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => {
          const { quantity, primaryUomQty, primaryUomSymbol } = row.original;
          const isCrossUom = primaryUomQty !== quantity;
          return (
            <span className="font-mono">
              <NumberCell value={quantity} /> {uomSymbol}
              {isCrossUom && (
                <span className="text-xs text-muted-foreground">
                  {' ('}
                  <NumberCell value={primaryUomQty} /> {primaryUomSymbol})
                </span>
              )}
            </span>
          );
        },
        enableSorting: true,
      },
      ...(isSerialTracked
        ? [
            {
              id: 'serials',
              header: 'Serials',
              cell: ({ row }) => (
                <Badge variant={row.original.isBalanced ? 'success' : 'warning'}>
                  {row.original.lineItemsCount}/{row.original.quantity}
                </Badge>
              ),
            } satisfies ColumnDef<GoodsReceiptLineData>,
          ]
        : []),
      ...((isSerialTracked && onSelectLine) || (!isSerialTracked && isDraft)
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }) =>
                isSerialTracked ? (
                  <RowActions
                    actions={[{ id: 'view', icon: Eye, label: 'View', onClick: () => onSelectLine?.(row.original.id) }]}
                  />
                ) : (
                  <RowActions
                    actions={[
                      {
                        id: 'edit',
                        icon: Pencil,
                        label: 'Edit',
                        permission: permissions.edit,
                        dialog: {
                          title: 'Edit Line',
                          description: 'Update the storage location or quantity for this line.',
                          content: (close) => (
                            <EditLineForm
                              binding={binding}
                              goodsReceiptId={goodsReceiptId}
                              itemId={scope.itemId}
                              inventoryItemId={scope.inventoryItemId}
                              line={row.original}
                              tracking={tracking}
                              allowDecimal={allowDecimal}
                              undistributedQty={undistributedQty}
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
                        permission: permissions.edit,
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
    [
      binding,
      permissions.edit,
      isSerialTracked,
      isDraft,
      onSelectLine,
      uomSymbol,
      tracking,
      scope.itemId,
      scope.inventoryItemId,
      goodsReceiptId,
      allowDecimal,
      undistributedQty,
      handleRemoveLine,
    ],
  );

  const linesTable = useDataTable({
    columns,
    query: linesTableQuery,
    slug:
      scope.kind === 'lot'
        ? binding.lotLinesTableSlug(goodsReceiptId, scope.itemId, scope.lotId)
        : binding.linesTableSlug(goodsReceiptId, scope.itemId),
    label: 'line',
    enableRowSelection: false,
    onStatePush: () =>
      queryClient.invalidateQueries({
        queryKey:
          scope.kind === 'lot'
            ? binding.lotLinesTableKey(goodsReceiptId, scope.itemId, scope.lotId)
            : binding.linesTableKey(goodsReceiptId, scope.itemId),
      }),
  });

  const addLineAction = isDraft && (
    <Button
      size="sm"
      permission={permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addLineDialog.open}
    >
      Add Line
    </Button>
  );

  return (
    <div className="space-y-3">
      <DataTable
        table={linesTable}
        mode="compact"
        permission={permissions.view}
        onRowClick={onSelectLine ? (line) => onSelectLine(line.id) : undefined}
        toolbarActions={{ actions: addLineAction }}
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No lines yet',
          description:
            scope.kind === 'item'
              ? 'Distribute the accepted quantity across storage locations.'
              : 'Add a line to start putting this lot away.',
          action: addLineAction,
        }}
      />

      <Dialog
        handle={addLineDialog}
        icon={PackageCheck}
        title="Add Line"
        description={
          isSerialTracked
            ? 'Pick a storage location for this line. Quantity is derived from the serials you add.'
            : 'Distribute the accepted stock across a storage location.'
        }
        content={(close) => (
          <AddLineForm
            binding={binding}
            goodsReceiptId={goodsReceiptId}
            itemId={scope.itemId}
            inventoryItemId={scope.inventoryItemId}
            goodsReceiptLotId={lotId}
            tracking={tracking}
            allowDecimal={allowDecimal}
            undistributedQty={undistributedQty}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
