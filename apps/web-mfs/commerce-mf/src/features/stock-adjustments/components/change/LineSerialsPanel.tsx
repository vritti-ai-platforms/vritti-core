import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  getSelectionColumn,
  RowActions,
  type SelectActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { DetailField, DetailSection } from '@vritti/quantum-ui/DetailField';
import { Empty } from '@vritti/quantum-ui/Empty';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useBarcodeScanner, useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { formatHotkey, KbdGroup } from '@vritti/quantum-ui/Kbd';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { ValueFilter } from '@vritti/quantum-ui/ValueFilter';
import { Pencil, Plus, ScanBarcode, Tags, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY,
  useAddStockAdjustmentLineItem,
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
  const addSerialMutation = useAddStockAdjustmentLineItem(adjustment.id, lineId ?? '');

  const scanner = useBarcodeScanner({
    mutation: addSerialMutation,
    toVariables: (code) => ({ serialNumber: code }),
    enabled: isDraft && !!lineId,
  });

  useEffect(() => {
    if (line?.isBalanced && pickDialog.isOpen) pickDialog.close();
  }, [line?.isBalanced, pickDialog]);

  const handleRemoveLine = async () => {
    if (!lineId) return;
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line and any picked serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) {
      removeLineMutation.mutate(lineId, { onSuccess: () => onLineRemoved() });
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
      ...(isDraft ? [getSelectionColumn<StockAdjustmentLineItemData>()] : []),
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
    enableRowSelection: isDraft,
    onStatePush: () => {
      if (lineId)
        queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustment.id, lineId) });
    },
  });

  const handleBulkUnpick = useCallback(
    async (rows: Parameters<SelectActions<StockAdjustmentLineItemData>>[0]) => {
      const confirmed = await confirm({
        title: `Remove ${rows.length} serial${rows.length === 1 ? '' : 's'}?`,
        description: 'These serials will no longer be consumed by this line.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (!confirmed) return;
      await Promise.all(rows.map((r) => removeItemMutation.mutateAsync(r.original.id)));
      table.resetRowSelection();
    },
    [confirm, removeItemMutation, table],
  );

  const isLoading = !!lineId && (isLineLoading || !line);
  const locationLabel = line
    ? [line.quantLotNumber, line.quantLocationPath ?? line.quantLocationName ?? line.quantLocationId].filter(Boolean).join(' @ ') || '—'
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
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold leading-none tracking-tight">{locationLabel}</h3>
              <Badge
                variant={line.isBalanced ? 'success' : 'warning'}
              >
                {line.lineItemsCount}/{line.quantity} · {line.isBalanced ? 'Balanced' : 'Not Balanced'}
              </Badge>
            </div>
            {isDraft && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={scanner.isActive ? 'default' : 'outline'}
                  startAdornment={<ScanBarcode className="size-3.5" />}
                  endAdornment={<KbdGroup className="ml-1" shortcut={scanner.toggleShortcut} />}
                  onClick={scanner.toggle}
                >
                  Scan Barcode
                </Button>
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
          </DetailSection>

          {scanner.isActive && (
            <Alert
              variant="info"
              icon={<ScanBarcode className="size-4" />}
              title="Scan Mode Active"
              description={`Point your scanner at a barcode — each scan auto-picks a serial for this line. Press ${formatHotkey(scanner.toggleShortcut).display} to toggle or ${formatHotkey(scanner.exitShortcut).display} to exit.`}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={scanner.disable}
                  endAdornment={<KbdGroup shortcut={scanner.exitShortcut} />}
                >
                  Exit
                </Button>
              }
            />
          )}

          <DataTable
            table={table}
            mode="compact"
            isLoading={isItemsLoading}
            searchConfig={{ columns: [{ id: 'serialNumber', label: 'Serial' }], searchAll: true }}
            filters={[<ValueFilter key="serialNumber" name="serialNumber" label="Serial" fieldType="string" />]}
            selectActions={(rows) => (
              <Button
                size="sm"
                variant="destructive"
                startAdornment={<Trash2 className="size-3.5" />}
                onClick={() => handleBulkUnpick(rows)}
                isLoading={removeItemMutation.isPending}
              >
                Remove
              </Button>
            )}
            toolbarActions={
              isDraft
                ? {
                    actions: (
                      <Button
                        size="sm"
                        startAdornment={<Plus className="size-4" />}
                        onClick={pickDialog.open}
                        disabled={!!line?.isBalanced || !line?.quantId}
                      >
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
              action:
                isDraft && !line?.isBalanced && !!line?.quantId ? (
                  <Button startAdornment={<Plus className="size-4" />} onClick={pickDialog.open}>
                    Pick Serial
                  </Button>
                ) : undefined,
            }}
          />
        </div>
      )}

      <PickSerialDialog
        adjustmentId={adjustment.id}
        lineId={lineId}
        quantId={line?.quantId ?? null}
        lineItemsCount={line?.lineItemsCount ?? 0}
        quantity={line?.quantity ?? 0}
        handle={pickDialog}
      />
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
