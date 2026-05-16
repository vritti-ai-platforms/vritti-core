import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
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
  useStockAdjustmentLine,
  useStockAdjustmentLineItemsTable,
} from '@/hooks/stock-adjustments';
import type { StockAdjustmentData, StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import { EditChangeLineDialog } from '../../forms/change/EditChangeLineDialog';
import { PickSerialDialog } from '../../forms/change/PickSerialDialog';

interface LineSerialsPanelProps {
  adjustment: StockAdjustmentData;
  lineId: string | null;
  isDraft: boolean;
  onLineRemoved: () => void;
}

export const LineSerialsPanel = ({ adjustment, lineId, isDraft, onLineRemoved }: LineSerialsPanelProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const pickDialog = useDialog();
  const editLineDialog = useDialog();

  const { data: line, isLoading: isLineLoading } = useStockAdjustmentLine(adjustment.id, lineId);
  const { data: response, isLoading: isItemsLoading } = useStockAdjustmentLineItemsTable(adjustment.id, lineId);
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);
  const removeItemMutation = useRemoveStockAdjustmentLineItem(adjustment.id, lineId ?? '');

  const handleRemoveLine = async () => {
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line and any picked serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) {
      removeLineMutation.mutate(lineId!, { onSuccess: () => onLineRemoved() });
    }
  };

  const handleUnpick = useCallback(
    async (item: StockAdjustmentLineItemData) => {
      const confirmed = await confirm({
        title: 'Remove this serial?',
        description: 'This serial will no longer be consumed by this line.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeItemMutation.mutate(item.id);
    },
    [confirm, removeItemMutation],
  );

  const columns = useMemo<ColumnDef<StockAdjustmentLineItemData>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: 'Serial Number',
        cell: ({ row }) => <span className="font-mono">{row.original.serialNumber}</span>,
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: 'Picked At',
        cell: ({ row }) => <FormattedDate value={row.original.createdAt} />,
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
                      id: 'unpick',
                      icon: Trash2,
                      label: 'Unpick',
                      variant: 'destructive',
                      onClick: () => handleUnpick(row.original),
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
    [isDraft, handleUnpick],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `stock-adjustment-${adjustment.id}-line-${lineId ?? 'none'}-items`,
    label: 'serial',
    enableRowSelection: false,
    onStatePush: () => {
      if (lineId)
        queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustment.id, lineId) });
    },
  });

  const isLoading = !!lineId && (isLineLoading || !line);
  const locationLabel = line
    ? line.quantLotNumber
      ? `${line.quantLotNumber} @ ${line.quantLocationName ?? line.quantLocationId ?? '—'}`
      : (line.quantLocationName ?? line.quantLocationId ?? '—')
    : '';

  return (
    <PageContentDetails
      isLoading={isLoading}
      isEmpty={!lineId}
      emptyState={<Empty icon={<Tags />} title="No line selected" description="Select a line from the left panel." />}
    >
      {line && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold leading-none tracking-tight">{locationLabel}</h3>
            {isDraft && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  startAdornment={<Pencil className="size-3.5" />}
                  onClick={editLineDialog.open}
                >
                  Edit Line
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  startAdornment={<Trash2 className="size-3.5" />}
                  onClick={handleRemoveLine}
                  isLoading={removeLineMutation.isPending}
                >
                  Remove Line
                </Button>
              </div>
            )}
          </div>

          <DetailSection wrap>
            <DetailField
              className="px-4 py-2"
              label="Available"
              value={
                line.quantAvailableQuantity != null
                  ? `${line.quantAvailableQuantity} ${adjustment.inventoryItemUomSymbol}`
                  : '—'
              }
            />
            <DetailField
              className="px-4 py-2"
              label="Quantity"
              value={`${line.quantity} ${adjustment.inventoryItemUomSymbol}`}
            />
            <DetailField className="px-4 py-2" label="Picked" value={line.lineItemsCount} />
            <DetailField
              className="px-4 py-2"
              label="Balanced"
              value={
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    line.isBalanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                  }`}
                >
                  {line.isBalanced ? 'Yes' : 'No'}
                </span>
              }
            />
          </DetailSection>

          <DataTable
            table={table}
            mode="compact"
            isLoading={isItemsLoading}
            searchConfig={{ columns: [{ id: 'serialNumber', label: 'Serial' }], searchAll: true }}
            toolbarActions={
              isDraft
                ? {
                    actions: (
                      <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={pickDialog.open}>
                        Pick Serial
                      </Button>
                    ),
                  }
                : undefined
            }
            emptyStateConfig={{
              icon: Tags,
              title: 'No serials picked',
              description: 'Pick a serial to consume.',
              action: isDraft ? (
                <Button startAdornment={<Plus className="size-4" />} onClick={pickDialog.open}>
                  Pick Serial
                </Button>
              ) : undefined,
            }}
          />
        </div>
      )}

      <PickSerialDialog adjustmentId={adjustment.id} lineId={lineId} handle={pickDialog} />
      <EditChangeLineDialog
        adjustmentId={adjustment.id}
        inventoryItemId={adjustment.inventoryItemId}
        line={line ?? null}
        tracking="serial"
        adjustmentType={adjustment.type}
        handle={editLineDialog}
      />
    </PageContentDetails>
  );
};
