import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Boxes, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  STOCK_ADJUSTMENT_LINES_TABLE_KEY,
  useRemoveStockAdjustmentLine,
  useStockAdjustmentLine,
  useStockAdjustmentLinesTable,
} from '@/hooks/stock-adjustments';
import type { StockAdjustmentData, StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { AddOpeningLineForm } from '../../forms/opening/AddOpeningLineForm';
import { EditOpeningLineForm } from '../../forms/opening/EditOpeningLineForm';
import { SerialsTable } from './SerialsTable';

interface OpeningSerialContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

export const OpeningSerialContent = ({ adjustment, isDraft }: OpeningSerialContentProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addLineDialog = useDialog();
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const { data: response, isLoading } = useStockAdjustmentLinesTable(adjustment.id);
  const { data: selectedLine = null } = useStockAdjustmentLine(adjustment.id, selectedLineId);
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);

  const handleRemove = useCallback(
    async (line: StockAdjustmentLineData) => {
      const confirmed = await confirm({
        title: 'Remove this line?',
        description: 'This line and any serials added under it will be removed.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) {
        removeLineMutation.mutate(line.id, {
          onSuccess: () => {
            if (selectedLineId === line.id) setSelectedLineId(null);
          },
        });
      }
    },
    [confirm, removeLineMutation, selectedLineId],
  );

  const columns = useMemo<ColumnDef<StockAdjustmentLineData>[]>(
    () => [
      {
        accessorKey: 'locationName',
        header: 'Location',
        cell: ({ row }) => row.original.locationName ?? row.original.locationId ?? '—',
        enableSorting: true,
      },
      {
        id: 'serialCount',
        header: 'Serial Count',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
              row.original.isBalanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
            }`}
          >
            {row.original.lineItemsCount}/{row.original.quantity}
          </span>
        ),
        enableSorting: false,
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
                        description: 'Update the storage location for this line.',
                        content: (close) => (
                          <EditOpeningLineForm
                            adjustmentId={adjustment.id}
                            inventoryItemId={adjustment.inventoryItemId}
                            line={row.original}
                            tracking="serial"
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
    [adjustment.id, isDraft, handleRemove, adjustment.inventoryItemId],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `stock-adjustment-${adjustment.id}-serial-lines`,
    label: 'line',
    enableRowSelection: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_TABLE_KEY(adjustment.id) }),
  });

  return (
    <PageContent>
      <PageContentDetails>
        <DataTable
          table={table}
          mode="compact"
          isLoading={isLoading}
          onRowClick={(row) => setSelectedLineId(row.id)}
          selectedRowId={selectedLineId}
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
            description: 'Add a line to start filling serials at a location.',
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
          description="Pick a storage location for this line. Quantity is derived from the serials you add."
          content={(close) => (
            <AddOpeningLineForm
              adjustmentId={adjustment.id}
              inventoryItemId={adjustment.inventoryItemId}
              primaryUomId={adjustment.inventoryItemUomId}
              stockAdjustmentLotId={null}
              tracking="serial"
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      </PageContentDetails>

      {selectedLineId ? (
        <SerialsTable
          adjustmentId={adjustment.id}
          inventoryItemId={adjustment.inventoryItemId}
          line={selectedLine}
          isDraft={isDraft}
          onLineRemoved={() => setSelectedLineId(null)}
        />
      ) : (
        <PageContentDetails className="flex items-center justify-center">
          <Empty icon={<Boxes />} title="Pick a line" description="Select a line to manage serial numbers." />
        </PageContentDetails>
      )}
    </PageContent>
  );
};
