import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Boxes, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  STOCK_ADJUSTMENT_LINES_BY_LOT_TABLE_KEY,
  useRemoveStockAdjustmentLine,
  useRemoveStockAdjustmentLot,
  useStockAdjustmentLinesByLotTable,
  useStockAdjustmentLotDetail,
} from '@/hooks/stock-adjustments';
import {
  type InventoryTracking,
  InventoryTrackingValues,
  type StockAdjustmentLineData,
  type StockAdjustmentLotDetailData,
} from '@/schemas/stock-adjustments';
import { AddOpeningLineForm } from '../../forms/opening/AddOpeningLineForm';
import { EditLotDialog } from '../../forms/opening/EditLotDialog';
import { EditOpeningLineForm } from '../../forms/opening/EditOpeningLineForm';

interface LotDetailPanelProps {
  adjustmentId: string;
  inventoryItemId: string;
  lotId: string | null;
  tracking: InventoryTracking;
  isDraft: boolean;
  uomSymbol: string;
  selectedLineId?: string | null;
  onSelectLine?: (lineId: string | null) => void;
  onLotRemoved?: () => void;
}

export const LotDetailPanel = ({ lotId, ...rest }: LotDetailPanelProps) => {
  const { data: lot, isLoading } = useStockAdjustmentLotDetail(rest.adjustmentId, lotId);

  return (
    <PageContentDetails
      isLoading={!!lotId && (isLoading || !lot)}
      loadingContent={<LotDetailPanelSkeleton />}
      isEmpty={!lotId}
      emptyState={
        <Empty icon={<Boxes />} title="No lot selected" description="Select a lot from the left panel." />
      }
    >
      {lot ? <LotDetailContent {...rest} lot={lot} /> : null}
    </PageContentDetails>
  );
};

function LotDetailPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-44" />
          <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-10 w-full rounded-none border-b" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: <static skeleton list, not dynamic>
            key={`lot-detail-row-${i}`}
            className="h-12 w-full rounded-none border-b last:border-b-0"
          />
        ))}
      </div>
    </div>
  );
}

interface LotDetailContentProps {
  adjustmentId: string;
  inventoryItemId: string;
  tracking: InventoryTracking;
  isDraft: boolean;
  uomSymbol: string;
  selectedLineId?: string | null;
  onSelectLine?: (lineId: string | null) => void;
  onLotRemoved?: () => void;
  lot: StockAdjustmentLotDetailData;
}

const LotDetailContent = ({
  adjustmentId,
  inventoryItemId,
  tracking,
  isDraft,
  uomSymbol,
  selectedLineId,
  onSelectLine,
  onLotRemoved,
  lot,
}: LotDetailContentProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const editLotDialog = useDialog();
  const addLineDialog = useDialog();

  const { data: response, isLoading: isLinesLoading } = useStockAdjustmentLinesByLotTable(adjustmentId, lot.id);

  const removeLotMutation = useRemoveStockAdjustmentLot(adjustmentId, {
    onSuccess: () => onLotRemoved?.(),
  });
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustmentId);

  const isSerial = tracking === InventoryTrackingValues.SERIAL || tracking === InventoryTrackingValues.LOT_SERIAL;

  const handleRemoveLine = useCallback(
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
            if (selectedLineId === line.id) onSelectLine?.(null);
          },
        });
      }
    },
    [confirm, removeLineMutation, selectedLineId, onSelectLine],
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
        accessorKey: 'locationPath',
        header: 'Path',
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.locationPath ?? '—'}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.quantity} {uomSymbol}
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
            } satisfies ColumnDef<StockAdjustmentLineData>,
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
                          <EditOpeningLineForm
                            adjustmentId={adjustmentId}
                            inventoryItemId={inventoryItemId}
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
            } satisfies ColumnDef<StockAdjustmentLineData>,
          ]
        : []),
    ],
    [adjustmentId, inventoryItemId, isDraft, isSerial, tracking, uomSymbol, handleRemoveLine],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `stock-adjustment-${adjustmentId}-lot-${lot.id}-lines`,
    label: 'line',
    enableRowSelection: false,
    onStatePush: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINES_BY_LOT_TABLE_KEY(adjustmentId, lot.id) });
    },
  });

  const handleRemoveLot = async () => {
    const confirmed = await confirm({
      title: `Remove lot ${lot.lotNumber}?`,
      description: 'This lot and all its lines and serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLotMutation.mutate(lot.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{lot.lotNumber}</h3>
          <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <div>
              Mfg: <FormattedDate value={lot.manufacturingDate} dateFormat="P" />
            </div>
            <div>
              Exp: <FormattedDate value={lot.expiryDate} dateFormat="P" />
            </div>
            <div>
              Total: {lot.totalQuantity} {uomSymbol}
            </div>
            <div>Lines: {lot.linesCount}</div>
          </div>
        </div>
        {isDraft && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              startAdornment={<Pencil className="size-3.5" />}
              onClick={editLotDialog.open}
            >
              Edit Lot
            </Button>
            <Button
              size="sm"
              variant="destructive"
              startAdornment={<Trash2 className="size-3.5" />}
              onClick={handleRemoveLot}
              isLoading={removeLotMutation.isPending}
            >
              Remove Lot
            </Button>
          </div>
        )}
      </div>

      <DataTable
        table={table}
        mode="compact"
        isLoading={isLinesLoading}
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
          description: 'Distribute opening stock across locations.',
          action: isDraft ? (
            <Button startAdornment={<Plus className="size-4" />} onClick={addLineDialog.open}>
              Add Line
            </Button>
          ) : undefined,
        }}
      />

      <EditLotDialog adjustmentId={adjustmentId} lot={lot} handle={editLotDialog} />

      <Dialog
        handle={addLineDialog}
        title="Add Line"
        description={
          isSerial
            ? 'Pick a storage location for this line. Quantity is derived from the serials you add.'
            : 'Distribute opening stock across a storage location.'
        }
        content={(close) => (
          <AddOpeningLineForm
            adjustmentId={adjustmentId}
            inventoryItemId={inventoryItemId}
            stockAdjustmentLotId={lot.id}
            tracking={tracking}
            excludeLocationIds={lot.locationIds}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
