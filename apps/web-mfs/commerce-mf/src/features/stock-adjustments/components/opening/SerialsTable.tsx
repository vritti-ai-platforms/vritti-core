import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY,
  useRemoveStockAdjustmentLine,
  useRemoveStockAdjustmentLineItem,
  useStockAdjustmentLineItemsTable,
} from '@/hooks/stock-adjustments';
import type { StockAdjustmentLineData, StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import { AddSerialDialog } from '../../forms/opening/AddSerialDialog';
import { EditOpeningLineForm } from '../../forms/opening/EditOpeningLineForm';

interface SerialsTableProps {
  adjustmentId: string;
  inventoryItemId: string;
  line: StockAdjustmentLineData | null;
  isDraft: boolean;
  onLineRemoved?: () => void;
}

// Right column for OPENING + serial flow: line items (serials) rendered as a DataTable.
// Edit / Remove of the selected LINE live in this panel's toolbar so the side rail stays clean.
export const SerialsTable = ({
  adjustmentId,
  inventoryItemId,
  line,
  isDraft,
  onLineRemoved,
}: SerialsTableProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addSerialDialog = useDialog();
  const editLineDialog = useDialog();
  const lineId = line?.id ?? null;

  const { data: response, isLoading } = useStockAdjustmentLineItemsTable(adjustmentId, lineId);
  const removeSerialMutation = useRemoveStockAdjustmentLineItem(adjustmentId, lineId ?? '');
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustmentId);

  const handleRemoveSerial = useCallback(
    async (item: StockAdjustmentLineItemData) => {
      const confirmed = await confirm({
        title: 'Remove this serial?',
        description: 'This serial will no longer be part of this line.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeSerialMutation.mutate(item.id);
    },
    [confirm, removeSerialMutation],
  );

  const handleRemoveLine = useCallback(async () => {
    if (!line) return;
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line and any serials added under it will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) {
      removeLineMutation.mutate(line.id, { onSuccess: () => onLineRemoved?.() });
    }
  }, [confirm, line, removeLineMutation, onLineRemoved]);

  const columns = useMemo<ColumnDef<StockAdjustmentLineItemData>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: 'Serial',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.serialNumber}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: 'Added',
        cell: ({ row }) => <FormattedDate value={row.original.createdAt} dateFormat="P" />,
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
                      id: 'delete',
                      icon: Trash2,
                      label: 'Remove',
                      variant: 'destructive',
                      onClick: () => handleRemoveSerial(row.original),
                    },
                  ]}
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } satisfies ColumnDef<StockAdjustmentLineItemData>,
          ]
        : []),
    ],
    [isDraft, handleRemoveSerial],
  );

  const tableSlug = lineId
    ? `stock-adjustment-${adjustmentId}-line-${lineId}-items`
    : `stock-adjustment-${adjustmentId}-line-none-items`;

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: tableSlug,
    label: 'serial',
    enableRowSelection: false,
    onStatePush: () => {
      if (lineId) {
        queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustmentId, lineId) });
      }
    },
  });

  if (!line) {
    return (
      <PageContentDetails className="flex items-center justify-center">
        <Empty icon={<Tags />} title="No line selected" description="Pick a line to add serials." />
      </PageContentDetails>
    );
  }

  const lastSerial = response?.result?.[response.result.length - 1]?.serialNumber;

  return (
    <PageContentDetails>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Serials</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {line.locationName ?? line.locationId ?? '—'} • {line.lineItemsCount} added
              {line.quantity ? ` of ${line.quantity}` : ''} • {line.isBalanced ? 'balanced' : 'unbalanced'}
            </p>
          </div>
          {isDraft && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                startAdornment={<Pencil className="size-4" />}
                onClick={editLineDialog.open}
              >
                Edit Line
              </Button>
              <Button
                size="sm"
                variant="destructive"
                startAdornment={<Trash2 className="size-4" />}
                onClick={handleRemoveLine}
                isLoading={removeLineMutation.isPending}
              >
                Remove Line
              </Button>
            </div>
          )}
        </div>

        <DataTable
          table={table}
          mode="compact"
          isLoading={isLoading}
          toolbarActions={
            isDraft
              ? {
                  actions: (
                    <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addSerialDialog.open}>
                      Add Serial
                    </Button>
                  ),
                }
              : undefined
          }
          emptyStateConfig={{
            icon: Tags,
            title: 'No serials',
            description: 'Add a serial to start filling this line.',
            action: isDraft ? (
              <Button startAdornment={<Plus className="size-4" />} onClick={addSerialDialog.open}>
                Add Serial
              </Button>
            ) : undefined,
          }}
        />
      </div>

      <AddSerialDialog
        adjustmentId={adjustmentId}
        lineId={lineId}
        lastSerial={lastSerial}
        handle={addSerialDialog}
      />

      <Dialog
        handle={editLineDialog}
        title="Edit Line"
        description="Update the storage location for this line."
        content={(close) => (
          <EditOpeningLineForm
            adjustmentId={adjustmentId}
            inventoryItemId={inventoryItemId}
            line={line}
            tracking="serial"
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </PageContentDetails>
  );
};
