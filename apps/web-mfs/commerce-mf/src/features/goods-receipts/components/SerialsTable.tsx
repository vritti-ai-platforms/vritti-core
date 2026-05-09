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
  GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY,
  useGoodsReceiptLineItemsTable,
  useRemoveGoodsReceiptLine,
  useRemoveGoodsReceiptLineItem,
} from '@/hooks/goods-receipts';
import type { GoodsReceiptLineData, GoodsReceiptLineItemData } from '@/schemas/goods-receipts';
import { AddSerialDialog } from '../forms/AddSerialDialog';
import { EditLineForm } from '../forms/EditLineForm';

interface SerialsTableProps {
  goodsReceiptId: string;
  itemId: string;
  inventoryItemId: string;
  line: GoodsReceiptLineData | null;
  isDraft: boolean;
  onLineRemoved?: () => void;
}

export const SerialsTable = ({
  goodsReceiptId,
  itemId,
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

  const { data: response, isLoading } = useGoodsReceiptLineItemsTable(goodsReceiptId, itemId, lineId);
  const removeSerialMutation = useRemoveGoodsReceiptLineItem(goodsReceiptId, itemId, lineId ?? '');
  const removeLineMutation = useRemoveGoodsReceiptLine(goodsReceiptId, itemId);

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
            } satisfies ColumnDef<GoodsReceiptLineItemData>,
          ]
        : []),
    ],
    [isDraft, handleRemoveSerial],
  );

  const tableSlug = lineId
    ? `gr-${goodsReceiptId}-line-${lineId}-items`
    : `gr-${goodsReceiptId}-line-none-items`;

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: tableSlug,
    label: 'serial',
    enableRowSelection: false,
    onStatePush: () => {
      if (lineId) {
        queryClient.invalidateQueries({
          queryKey: GOODS_RECEIPT_LINE_ITEMS_TABLE_KEY(goodsReceiptId, itemId, lineId),
        });
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
        goodsReceiptId={goodsReceiptId}
        itemId={itemId}
        lineId={lineId}
        lastSerial={lastSerial}
        handle={addSerialDialog}
      />

      <Dialog
        handle={editLineDialog}
        title="Edit Line"
        description="Update the storage location for this line."
        content={(close) => (
          <EditLineForm
            goodsReceiptId={goodsReceiptId}
            itemId={itemId}
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
