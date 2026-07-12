import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, NumberCell, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { UomFilter } from '@vritti/quantum-ui/selects/uom';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type { InventoryTracking, StockAdjustmentData, StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import {
  STOCK_ADJUSTMENT_LINES_TABLE_KEY,
  useRemoveStockAdjustmentLine,
  useStockAdjustmentLinesTable,
} from '@/hooks/site/stock-adjustments';
import { AddChangeLineDialog } from '../../forms/change/AddChangeLineDialog';
import { EditChangeLineForm } from '../../forms/change/EditChangeLineDialog';

interface ChangeContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
  tracking: Extract<InventoryTracking, 'quantity' | 'lot'>;
}

export const ChangeContent = ({ adjustment, isDraft, tracking }: ChangeContentProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addLineDialog = useDialog();

  const uomSymbol = adjustment.inventoryItemUomSymbol;

  const { data: response, isLoading } = useStockAdjustmentLinesTable(adjustment.id);
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);

  const handleRemoveLine = useCallback(
    async (line: StockAdjustmentLineData) => {
      const confirmed = await confirm({
        title: 'Remove this line?',
        description: 'This line will be removed.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeLineMutation.mutate(line.id);
    },
    [confirm, removeLineMutation],
  );

  const columns = useMemo<ColumnDef<StockAdjustmentLineData>[]>(
    () => [
      {
        id: 'quant',
        header: 'Quant (Lot @ Location)',
        cell: ({ row }) => {
          const lot = row.original.quantLotNumber ? `${row.original.quantLotNumber} @ ` : '';
          return `${lot}${row.original.quantLocationName ?? row.original.quantLocationId ?? '—'}`;
        },
        enableSorting: false,
      },
      {
        id: 'available',
        header: 'Available',
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">
            {row.original.quantAvailableQuantity != null ? (
              <NumberCell value={row.original.quantAvailableQuantity} />
            ) : (
              '—'
            )}{' '}
            {uomSymbol}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'uomQty',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.uomQty} /> {row.original.uomSymbol ?? uomSymbol}
          </span>
        ),
        enableSorting: true,
      },
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
                        description: 'Update the quantity for this line.',
                        content: (close) => (
                          <EditChangeLineForm
                            adjustmentId={adjustment.id}
                            inventoryItemId={adjustment.inventoryItemId}
                            line={row.original}
                            tracking={tracking}
                            adjustmentType={adjustment.type}
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
            } satisfies ColumnDef<StockAdjustmentLineData>,
          ]
        : []),
    ],
    [isDraft, uomSymbol, handleRemoveLine, adjustment, tracking],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `stock-adjustment-${adjustment.id}-change-lines`,
    label: 'line',
    enableRowSelection: false,
    onStatePush: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_TABLE_KEY(adjustment.id) });
    },
  });

  return (
    <>
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'quant', label: 'Quant' },
            { id: 'quantLocationName', label: 'Location' },
          ],
          searchAll: true,
        }}
        filters={[<UomFilter key="uomId" params={{ inventoryItemId: adjustment.inventoryItemId }} />]}
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
          description: 'Pick a quant to start.',
          action: isDraft ? (
            <Button startAdornment={<Plus className="size-4" />} onClick={addLineDialog.open}>
              Add Line
            </Button>
          ) : undefined,
        }}
      />

      <AddChangeLineDialog
        adjustmentId={adjustment.id}
        inventoryItemId={adjustment.inventoryItemId}
        primaryUomId={adjustment.inventoryItemUomId}
        tracking={tracking}
        adjustmentType={adjustment.type}
        handle={addLineDialog}
      />
    </>
  );
};
