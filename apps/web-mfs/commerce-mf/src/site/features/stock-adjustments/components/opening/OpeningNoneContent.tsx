import { useQueryClient } from '@tanstack/react-query';
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
import { UomFilter } from '@vritti/quantum-ui/selects/uom';
import { ClipboardList, ClipboardMinus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type { StockAdjustmentData, StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import {
  STOCK_ADJUSTMENT_LINES_TABLE_KEY,
  useRemoveStockAdjustmentLine,
  useStockAdjustmentLinesTable,
} from '@/site/hooks/stock-adjustments';
import { AddOpeningLineForm } from '../../forms/opening/AddOpeningLineForm';
import { EditOpeningLineForm } from '../../forms/opening/EditOpeningLineForm';

interface OpeningNoneContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

export const OpeningNoneContent = ({ adjustment, isDraft }: OpeningNoneContentProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addLineDialog = useDialog();

  const { data: response, isLoading } = useStockAdjustmentLinesTable(adjustment.id);
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);

  const handleRemove = useCallback(
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
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) => <StringCell value={row.original.locationName ?? row.original.locationId} />,
        enableSorting: true,
      },
      {
        accessorKey: 'locationPath',
        header: 'Path',
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.locationPath ?? '—'}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'uomQty',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.uomQty} /> {row.original.uomSymbol ?? adjustment.inventoryItemUomSymbol}
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
                        description: 'Update the storage location or quantity for this line.',
                        content: (close) => (
                          <EditOpeningLineForm
                            adjustmentId={adjustment.id}
                            inventoryItemId={adjustment.inventoryItemId}
                            line={row.original}
                            tracking="quantity"
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
                      onClick: () => handleRemove(row.original),
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
    [adjustment.id, adjustment.inventoryItemUomSymbol, isDraft, handleRemove, adjustment.inventoryItemId],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `stock-adjustment-${adjustment.id}-lines`,
    label: 'line',
    enableRowSelection: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_TABLE_KEY(adjustment.id) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        searchConfig={{ columns: [{ id: 'locationName', label: 'Location' }], searchAll: true }}
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
          description: 'Distribute opening stock across locations.',
          action: isDraft ? (
            <Button startAdornment={<Plus className="size-4" />} onClick={addLineDialog.open}>
              Add Line
            </Button>
          ) : undefined,
        }}
      />

      <Dialog
        handle={addLineDialog}
        icon={ClipboardMinus}
        title="Add Line"
        description="Distribute opening stock across a storage location."
        content={(close) => (
          <AddOpeningLineForm
            adjustmentId={adjustment.id}
            inventoryItemId={adjustment.inventoryItemId}
            primaryUomId={adjustment.inventoryItemUomId}
            stockAdjustmentLotId={null}
            tracking="quantity"
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
