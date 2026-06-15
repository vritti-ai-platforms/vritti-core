import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CompactTableSkeleton,
  DataTable,
  NumberCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { UomFilter } from '@vritti/quantum-ui/selects/uom';
import { ValueFilter } from '@vritti/quantum-ui/ValueFilter';
import { Boxes, ClipboardList, ClipboardMinus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  STOCK_ADJUSTMENT_LINES_BY_LOT_TABLE_KEY,
  useDeleteStockAdjustmentLot,
  useRemoveStockAdjustmentLine,
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
  primaryUomId: string;
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
      emptyState={<Empty icon={<Boxes />} title="No lot selected" description="Select a lot from the left panel." />}
    >
      {lot ? <LotDetailContent {...rest} lot={lot} /> : null}
    </PageContentDetails>
  );
};

function LotDetailPanelSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header group: title row + stat plate (mirrors LotDetailContent's `space-y-5` wrapper) */}

      {/* Title row: lot number left, action buttons right */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>

      {/* Stat plate: bordered + divided strip with 4 label/value cells */}
      <DetailSection>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: <static skeleton list>
            key={`lot-stat-${i}`}
            className="space-y-1.5 px-4 py-2"
          >
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </DetailSection>

      {/* DataTable toolbar: Add Line anchored right */}
      <div className="flex items-center justify-end">
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Compact DataTable placeholder: Location / Path / Quantity + row actions */}
      <CompactTableSkeleton
        rows={5}
        actions
        columns={[
          { headerWidth: 'w-20', cellWidth: 'w-28' },
          { headerWidth: 'w-12', cellWidth: 'w-44' },
          { headerWidth: 'w-16', cellWidth: 'w-16' },
        ]}
      />
    </div>
  );
}

interface LotDetailContentProps {
  adjustmentId: string;
  inventoryItemId: string;
  primaryUomId: string;
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
  primaryUomId,
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

  const deleteLotMutation = useDeleteStockAdjustmentLot(adjustmentId, {
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
        accessorKey: 'uomQty',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.uomQty} /> {row.original.uomSymbol ?? uomSymbol}
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
                  {row.original.lineItemsCount}/{row.original.uomQty}
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

  const handleDeleteLot = async () => {
    const confirmed = await confirm({
      title: `Delete lot ${lot.lotNumber}?`,
      description: 'This lot and all its lines and serials will be deleted.',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (confirmed) deleteLotMutation.mutate(lot.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold leading-none tracking-tight">{lot.lotNumber}</h3>
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
              onClick={handleDeleteLot}
              isLoading={deleteLotMutation.isPending}
            >
              Delete Lot
            </Button>
          </div>
        )}
      </div>
      <DetailSection wrap>
        <DetailField className="px-4 py-2" label="Mfg" type="date" value={lot.manufacturingDate} />
        <DetailField className="px-4 py-2" label="Exp" type="date" value={lot.expiryDate} />
        <DetailField
          className="px-4 py-2"
          label="Total"
          type="string"
          mono
          value={`${lot.totalQuantity} ${uomSymbol}`}
        />
        <DetailField className="px-4 py-2" label="Lines" type="number" value={lot.linesCount} />
      </DetailSection>

      <DataTable
        table={table}
        mode="compact"
        isLoading={isLinesLoading}
        onRowClick={onSelectLine ? (row) => onSelectLine(row.id) : undefined}
        selectedRowId={selectedLineId ?? null}
        searchConfig={{
          columns: [
            { id: 'locationName', label: 'Location' },
            { id: 'locationPath', label: 'Path' },
          ],
          searchAll: true,
        }}
        filters={[
          <ValueFilter key="quantity" name="quantity" label="Quantity" fieldType="number" />,
          <UomFilter key="uomId" params={{ inventoryItemId }} />,
        ]}
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
        icon={ClipboardMinus}
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
            primaryUomId={primaryUomId}
            stockAdjustmentLotId={lot.id}
            tracking={tracking}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
