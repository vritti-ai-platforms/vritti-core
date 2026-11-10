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
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { ScanBarcodeButton } from '@vritti/quantum-ui/ScanBarcodeButton';
import { ValueFilter } from '@vritti/quantum-ui/ValueFilter';
import { PackageCheck, Pencil, Plus, ScanBarcode, Tags, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import type { GoodsReceiptLineData, GoodsReceiptLineItemData } from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../bindings';
import { AddSerialDialog } from './forms/AddSerialDialog';
import { EditLineForm } from './forms/EditLineForm';

interface SerialsTableProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  line: GoodsReceiptLineData;
  isDraft: boolean;
  allowDecimal: boolean;
  undistributedQty: number;
  onLineRemoved: () => void;
}

// A serial-tracked line's serials, added by hand or by scanning until the line is balanced
export const SerialsTable: React.FC<SerialsTableProps> = ({
  binding,
  goodsReceiptId,
  itemId,
  inventoryItemId,
  line,
  isDraft,
  allowDecimal,
  undistributedQty,
  onLineRemoved,
}) => {
  const { permissions } = binding;
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const addSerialDialog = useDialog();
  const editLineDialog = useDialog();

  const lineItemsTableQuery = binding.useLineItemsTable(goodsReceiptId, itemId, line.id);
  const removeSerialMutation = binding.useRemoveLineItem(goodsReceiptId, itemId, line.id);
  const removeLineMutation = binding.useRemoveLine(goodsReceiptId, itemId);
  const addSerialMutation = binding.useAddLineItem(goodsReceiptId, itemId, line.id);

  const scanner = useBarcodeScanner({
    mutation: addSerialMutation,
    toVariables: (code) => ({ serialNumber: code }),
    enabled: isDraft && !line.isBalanced,
  });

  // A balanced line takes no more serials, so the add dialog closes on its own
  useEffect(() => {
    if (line.isBalanced && addSerialDialog.isOpen) addSerialDialog.close();
  }, [line.isBalanced, addSerialDialog]);

  // Confirms and removes one serial
  const handleRemoveSerial = useCallback(
    async (serial: GoodsReceiptLineItemData) => {
      const confirmed = await confirm({
        title: `Remove serial ${serial.serialNumber}?`,
        description: `${serial.serialNumber} will no longer be part of this line.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeSerialMutation.mutate(serial.id);
    },
    [confirm, removeSerialMutation],
  );

  // Confirms and removes the line with its serials
  const handleRemoveLine = useCallback(async () => {
    const location = line.locationName ?? 'this location';
    const confirmed = await confirm({
      title: `Remove the line at ${location}?`,
      description: `The line at ${location} and its ${pluralize('serial', line.lineItemsCount, true)} will be removed.`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLineMutation.mutate(line.id, { onSuccess: onLineRemoved });
  }, [confirm, line, removeLineMutation, onLineRemoved]);

  const columns = useMemo<ColumnDef<GoodsReceiptLineItemData>[]>(
    () => [
      ...(isDraft ? [getSelectionColumn<GoodsReceiptLineItemData>()] : []),
      {
        accessorKey: 'serialNumber',
        header: 'Serial',
        cell: ({ row }) => <StringCell value={row.original.serialNumber} mono />,
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
                      id: 'remove',
                      icon: Trash2,
                      label: 'Remove',
                      variant: 'destructive',
                      permission: permissions.edit,
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
    [isDraft, permissions.edit, handleRemoveSerial],
  );

  const lineItemsTable = useDataTable({
    columns,
    query: lineItemsTableQuery,
    slug: binding.lineItemsTableSlug(goodsReceiptId, line.id),
    label: 'serial',
    enableRowSelection: isDraft,
    onStatePush: () =>
      queryClient.invalidateQueries({ queryKey: binding.lineItemsTableKey(goodsReceiptId, itemId, line.id) }),
  });
  const { table } = lineItemsTable;

  // Confirms and removes the selected serials together
  const handleBulkRemove = useCallback(
    async (rows: Parameters<SelectActions<GoodsReceiptLineItemData>>[0]) => {
      const confirmed = await confirm({
        title: `Remove ${pluralize('serial', rows.length, true)}?`,
        description: 'These serials will no longer be part of this line.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (!confirmed) return;
      await Promise.all(rows.map((row) => removeSerialMutation.mutateAsync(row.original.id)));
      table.resetRowSelection();
    },
    [confirm, removeSerialMutation, table],
  );

  const lastSerial = lineItemsTableQuery.data?.result[lineItemsTableQuery.data.result.length - 1]?.serialNumber;

  const addSerialAction = isDraft && (
    <Button
      size="sm"
      permission={permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addSerialDialog.open}
      disabled={line.isBalanced}
      disabledTip="The line has all its serials. Raise its quantity to add more."
    >
      Add Serial
    </Button>
  );

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
            <p className="text-xs text-muted-foreground mt-0.5">{line.locationPath ?? line.locationName}</p>
          </div>
          {isDraft && (
            <div className="flex items-center gap-2">
              <ScanBarcodeButton scanner={scanner} disabled={line.isBalanced} />
              <Button
                size="sm"
                variant="outline"
                permission={permissions.edit}
                startAdornment={<Pencil className="size-4" />}
                onClick={editLineDialog.open}
              >
                Edit Line
              </Button>
              <Button
                size="sm"
                variant="destructive"
                permission={permissions.edit}
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
          table={lineItemsTable}
          mode="compact"
          permission={permissions.view}
          searchConfig={{ columns: [{ id: 'serialNumber', label: 'Serial' }], searchAll: true }}
          filters={[<ValueFilter key="serialNumber" name="serialNumber" label="Serial" fieldType="string" />]}
          selectActions={(rows) => (
            <Button
              size="sm"
              variant="destructive"
              permission={permissions.edit}
              startAdornment={<Trash2 className="size-4" />}
              onClick={() => handleBulkRemove(rows)}
              isLoading={removeSerialMutation.isPending}
            >
              Remove
            </Button>
          )}
          toolbarActions={{ actions: addSerialAction }}
          emptyStateConfig={{
            icon: Tags,
            title: 'No serials',
            description: 'Add a serial to start filling this line.',
            action: addSerialAction,
          }}
        />
      </div>

      <AddSerialDialog
        binding={binding}
        goodsReceiptId={goodsReceiptId}
        itemId={itemId}
        lineId={line.id}
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
            binding={binding}
            goodsReceiptId={goodsReceiptId}
            itemId={itemId}
            inventoryItemId={inventoryItemId}
            line={line}
            tracking="SERIAL"
            allowDecimal={allowDecimal}
            undistributedQty={undistributedQty}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
