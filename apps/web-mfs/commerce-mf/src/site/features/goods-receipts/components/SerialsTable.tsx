import { useQueryClient } from '@tanstack/react-query';
import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  getSelectionColumn,
  RowActions,
  type SelectActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useBarcodeScanner, useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { formatHotkey, KbdGroup } from '@vritti/quantum-ui/Kbd';
import { ScanBarcodeButton } from '@vritti/quantum-ui/ScanBarcodeButton';
import { ValueFilter } from '@vritti/quantum-ui/ValueFilter';
import { PackageCheck, Pencil, Plus, ScanBarcode, Tags, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import type { GoodsReceiptLineData, GoodsReceiptLineItemData } from '@/schemas/goods-receipts';
import {
  GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY,
  useAddGoodsReceiptLineItem,
  useGoodsReceiptLineItemsTable,
  useRemoveGoodsReceiptLine,
  useRemoveGoodsReceiptLineItem,
} from '@/site/hooks/goods-receipts';
import { AddSerialDialog } from '../forms/AddSerialDialog';
import { EditLineForm } from '../forms/EditLineForm';

interface SerialsTableProps {
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  line: GoodsReceiptLineData;
  isDraft: boolean;
  allowDecimal: boolean;
  poRemainingQuantity: number | null;
  onLineRemoved?: () => void;
}

export const SerialsTable = ({
  goodsReceiptId,
  itemId,
  inventoryItemId,
  line,
  isDraft,
  allowDecimal,
  poRemainingQuantity,
  onLineRemoved,
}: SerialsTableProps) => {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addSerialDialog = useDialog();
  const editLineDialog = useDialog();
  const lineId = line.id;

  const { data: response, isLoading } = useGoodsReceiptLineItemsTable(goodsReceiptId, itemId, lineId);
  const removeSerialMutation = useRemoveGoodsReceiptLineItem(goodsReceiptId, itemId, lineId ?? '');
  const removeLineMutation = useRemoveGoodsReceiptLine(goodsReceiptId, itemId);
  const addSerialMutation = useAddGoodsReceiptLineItem(goodsReceiptId, itemId, lineId ?? '');

  const scanner = useBarcodeScanner({
    mutation: addSerialMutation,
    toVariables: (code) => ({ serialNumber: code }),
    enabled: isDraft && !!lineId && !line?.isBalanced,
  });

  useEffect(() => {
    if (line?.isBalanced && addSerialDialog.isOpen) addSerialDialog.close();
  }, [line?.isBalanced, addSerialDialog]);

  const handleRemoveSerial = useCallback(
    async (item: GoodsReceiptLineItemData) => {
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

  const columns = useMemo<ColumnDef<GoodsReceiptLineItemData>[]>(
    () => [
      ...(isDraft ? [getSelectionColumn<GoodsReceiptLineItemData>()] : []),
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
            } satisfies ColumnDef<GoodsReceiptLineItemData>,
          ]
        : []),
    ],
    [isDraft, handleRemoveSerial],
  );

  const tableSlug = lineId ? `gr-${goodsReceiptId}-line-${lineId}-items` : `gr-${goodsReceiptId}-line-none-items`;

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: tableSlug,
    label: 'serial',
    enableRowSelection: isDraft,
    onStatePush: () => {
      if (lineId) {
        queryClient.invalidateQueries({
          queryKey: GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY(goodsReceiptId, itemId, lineId),
        });
      }
    },
  });

  const handleBulkRemove = useCallback(
    async (rows: Parameters<SelectActions<GoodsReceiptLineItemData>>[0]) => {
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

  const lastSerial = response?.result?.[response.result.length - 1]?.serialNumber;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Serials</h3>
              <Badge variant={line.isBalanced ? 'success' : 'warning'}>
                {line.lineItemsCount}/{line.quantity} · {line.isBalanced ? 'Balanced' : 'Not Balanced'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {line.locationPath ?? line.locationName ?? line.locationId ?? '—'}
            </p>
          </div>
          {isDraft && (
            <div className="flex items-center gap-2">
              <ScanBarcodeButton scanner={scanner} disabled={!!line.isBalanced} />
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
                      disabled={!!line.isBalanced}
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
              isDraft && !line.isBalanced ? (
                <Button startAdornment={<Plus className="size-4" />} onClick={addSerialDialog.open}>
                  Add Serial
                </Button>
              ) : undefined,
          }}
        />
      </div>

      <AddSerialDialog
        goodsReceiptId={goodsReceiptId}
        itemId={itemId}
        lineId={lineId}
        lastSerial={lastSerial}
        handle={addSerialDialog}
      />

      <Dialog
        handle={editLineDialog}
        icon={PackageCheck}
        title="Edit Line"
        description="Update the storage location for this line."
        content={(close) => (
          <EditLineForm
            goodsReceiptId={goodsReceiptId}
            itemId={itemId}
            inventoryItemId={inventoryItemId}
            line={line}
            tracking="serial"
            allowDecimal={allowDecimal}
            poRemainingQuantity={poRemainingQuantity}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
