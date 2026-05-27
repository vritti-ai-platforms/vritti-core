import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CompactTableSkeleton,
  DataTable,
  DateCell,
  getSelectionColumn,
  RowActions,
  type SelectActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useBarcodeScanner, useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { formatHotkey, KbdGroup } from '@vritti/quantum-ui/Kbd';
import { PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
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
import type { StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import { AddSerialDialog } from '../../forms/opening/AddSerialDialog';
import { EditOpeningLineForm } from '../../forms/opening/EditOpeningLineForm';

interface SerialsTableProps {
  adjustmentId: string;
  inventoryItemId: string;
  lineId: string | null;
  isDraft: boolean;
  onLineRemoved?: () => void;
}

// Right column for OPENING + serial flow: line items (serials) rendered as a DataTable.
// Edit / Remove of the selected LINE live in this panel's toolbar so the side rail stays clean.
export const SerialsTable = ({ adjustmentId, inventoryItemId, lineId, isDraft, onLineRemoved }: SerialsTableProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addSerialDialog = useDialog();
  const editLineDialog = useDialog();

  const { data: line, isLoading: lineLoading } = useStockAdjustmentLine(adjustmentId, lineId);
  const { data: response, isLoading } = useStockAdjustmentLineItemsTable(adjustmentId, lineId);
  const removeSerialMutation = useRemoveStockAdjustmentLineItem(adjustmentId, lineId ?? '');
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustmentId);
  const addSerialMutation = useAddStockAdjustmentLineItem(adjustmentId, lineId ?? '');

  const scanner = useBarcodeScanner({
    mutation: addSerialMutation,
    toVariables: (code) => ({ serialNumber: code }),
    enabled: isDraft && !!lineId,
  });

  useEffect(() => {
    if (line?.isBalanced && addSerialDialog.isOpen) addSerialDialog.close();
  }, [line?.isBalanced, addSerialDialog]);

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
      ...(isDraft ? [getSelectionColumn<StockAdjustmentLineItemData>()] : []),
      {
        accessorKey: 'serialNumber',
        header: 'Serial',
        cell: ({ row }) => <StringCell value={row.original.serialNumber} mono className="text-sm" />,
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: 'Added',
        cell: ({ row }) => <DateCell value={row.original.createdAt} />,
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
    enableRowSelection: isDraft,
    onStatePush: () => {
      if (lineId) {
        queryClient.invalidateQueries({ queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustmentId, lineId) });
      }
    },
  });

  const handleBulkRemove = useCallback(
    async (rows: Parameters<SelectActions<StockAdjustmentLineItemData>>[0]) => {
      const confirmed = await confirm({
        title: `Remove ${rows.length} serial${rows.length === 1 ? '' : 's'}?`,
        description: 'These serials will no longer be part of this line.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (!confirmed) return;
      await Promise.all(rows.map((r) => removeSerialMutation.mutateAsync(r.original.id)));
      table.resetRowSelection();
    },
    [confirm, removeSerialMutation, table],
  );

  if (!lineId) {
    return (
      <PageContentDetails className="flex items-center justify-center">
        <Empty icon={<Tags />} title="No line selected" description="Pick a line to add serials." />
      </PageContentDetails>
    );
  }

  const lastSerial = response?.result?.[response.result.length - 1]?.serialNumber;

  const skeleton = (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
      <CompactTableSkeleton
        columns={[
          { headerWidth: 'w-4', cellWidth: 'w-4' },
          { headerWidth: 'w-16', cellWidth: 'w-40' },
          { headerWidth: 'w-12', cellWidth: 'w-24' },
        ]}
        actions
      />
    </div>
  );

  return (
    <PageContentDetails isLoading={lineLoading} loadingContent={skeleton} className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Serials</h3>
              {line && (
                <Badge
                  variant={line.isBalanced ? 'success' : 'warning'}
                >
                  {line.lineItemsCount}/{line.uomQty} · {line.isBalanced ? 'Balanced' : 'Not Balanced'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {line?.locationPath ?? line?.locationName ?? line?.locationId ?? '—'}
            </p>
          </div>
          {isDraft && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={scanner.isActive ? 'default' : 'outline'}
                startAdornment={<ScanBarcode className="size-4" />}
                endAdornment={<KbdGroup className="ml-1" shortcut={scanner.toggleShortcut} />}
                onClick={scanner.toggle}
              >
                Scan Barcode
              </Button>
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

        {scanner.isActive && (
          <Alert
            variant="info"
            icon={<ScanBarcode className="size-4" />}
            title="Scan Mode Active"
            description={`Point your scanner at a barcode — each scan auto-inserts a serial to this line. Press ${formatHotkey(scanner.toggleShortcut).display} to toggle or ${formatHotkey(scanner.exitShortcut).display} to exit.`}
            action={
              <Button
                size="sm"
                variant="secondary"
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
          isLoading={isLoading}
          searchConfig={{ columns: [{ id: 'serialNumber', label: 'Serial' }], searchAll: true }}
          filters={[<ValueFilter key="serialNumber" name="serialNumber" label="Serial" fieldType="string" />]}
          selectActions={(rows) => (
            <Button
              size="sm"
              variant="destructive"
              startAdornment={<Trash2 className="size-4" />}
              onClick={() => handleBulkRemove(rows)}
              isLoading={removeSerialMutation.isPending}
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
                      onClick={addSerialDialog.open}
                      disabled={!!line?.isBalanced}
                    >
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
            action:
              isDraft && !line?.isBalanced ? (
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
        lineItemsCount={line?.lineItemsCount}
        quantity={line?.uomQty}
        handle={addSerialDialog}
      />

      <Dialog
        handle={editLineDialog}
        title="Edit Line"
        description="Update the storage location for this line."
        content={(close) =>
          line ? (
            <EditOpeningLineForm
              adjustmentId={adjustmentId}
              inventoryItemId={inventoryItemId}
              line={line}
              tracking="serial"
              onSuccess={close}
              onCancel={close}
            />
          ) : null
        }
      />
    </PageContentDetails>
  );
};
