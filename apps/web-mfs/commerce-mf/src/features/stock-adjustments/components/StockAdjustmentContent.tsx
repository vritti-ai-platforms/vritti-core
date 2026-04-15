import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { type ColumnDef, DataTable, useDataTable } from '@vritti/quantum-ui/DataTable';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ClipboardList, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY,
  useRemoveStockAdjustmentLine,
  useRemoveStockAdjustmentLineItem,
  useStockAdjustmentLineItemsTable,
  useStockAdjustmentLines,
} from '@/hooks/stock-adjustments';
import type { StockAdjustmentData, StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import { AddLineItemDialogForm } from '../forms/AddLineItemDialogForm';
import { EditLineItemDialogForm } from '../forms/EditLineItemDialogForm';
import { EditStockAdjustmentLineDialogForm } from '../forms/EditStockAdjustmentLineDialogForm';

interface StockAdjustmentContentProps {
  adjustment: StockAdjustmentData;
  selectedLineId: string | null;
  isDraft: boolean;
  isOpeningStock: boolean;
}

export const StockAdjustmentContent = ({
  adjustment,
  selectedLineId,
  isDraft,
  isOpeningStock,
}: StockAdjustmentContentProps) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const editLineDialog = useDialog();
  const addLineItemDialog = useDialog();
  const editLineItemDialog = useDialog();
  const [editingItem, setEditingItem] = useState<StockAdjustmentLineItemData | null>(null);

  const { data: lines = [] } = useStockAdjustmentLines(adjustment.id);
  const selectedLine = useMemo(
    () => lines.find((line) => line.id === selectedLineId) ?? lines[0] ?? null,
    [lines, selectedLineId],
  );
  const { data: lineItemsResponse, isLoading: isLoadingLineItems } = useStockAdjustmentLineItemsTable(
    adjustment.id,
    selectedLine?.id ?? null,
  );
  const lineItems = lineItemsResponse?.result ?? [];

  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);
  const removeLineItemMutation = useRemoveStockAdjustmentLineItem(adjustment.id, selectedLine?.id ?? '');

  const handleRemoveLineItem = useCallback(
    async (itemId: string) => {
      const confirmed = await confirm({
        title: 'Remove this line item?',
        description: 'This line item will be removed.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeLineItemMutation.mutate(itemId);
    },
    [confirm, removeLineItemMutation],
  );

  const lineItemColumns = useMemo<ColumnDef<StockAdjustmentLineItemData>[]>(
    () => [
      {
        accessorKey: 'quantity',
        header: 'Quantity',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 justify-end">
            {isDraft && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingItem(row.original);
                  editLineItemDialog.open();
                }}
              >
                Edit
              </Button>
            )}
            {isDraft && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleRemoveLineItem(row.original.id)}
              >
                Delete
              </Button>
            )}
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [isDraft, editLineItemDialog, handleRemoveLineItem],
  );

  const { table } = useDataTable({
    columns: lineItemColumns,
    serverState: lineItemsResponse,
    slug: `stock-adjustment-${adjustment.id}-line-${selectedLine?.id ?? 'none'}-items`,
    label: 'line item',
    enableRowSelection: false,
    onStatePush: () => {
      if (!selectedLine?.id) return;
      queryClient.invalidateQueries({
        queryKey: STOCK_ADJUSTMENT_LINE_ITEMS_TABLE_KEY(adjustment.id, selectedLine.id),
      });
    },
  });

  async function handleRemoveLine(lineId: string) {
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line and its line items will be removed from the adjustment.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLineMutation.mutate(lineId);
  }

  return (
    <div className="flex flex-col">
      {selectedLine ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Line</h3>
              <Badge variant={selectedLine.isLineItemsBalanced ? 'secondary' : 'destructive'}>
                {selectedLine.isLineItemsBalanced ? 'Balanced' : 'Unbalanced'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isDraft && (
                <Button
                  size="sm"
                  variant="outline"
                  startAdornment={<Pencil className="size-3.5" />}
                  onClick={editLineDialog.open}
                >
                  Edit Line
                </Button>
              )}
              {isDraft && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  startAdornment={<Trash2 className="size-3.5" />}
                  onClick={() => handleRemoveLine(selectedLine.id)}
                >
                  Remove Line
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Quantity" value={selectedLine.quantity} />
                <DetailField
                  label={isOpeningStock ? 'Location' : 'Batch'}
                  value={
                    isOpeningStock
                      ? (selectedLine.locationName ?? selectedLine.locationId ?? '—')
                      : selectedLine.batchNumber
                        ? `Batch #${selectedLine.batchNumber}`
                        : (selectedLine.batchId ?? '—')
                  }
                />
                <DetailField label="Manufacturing Date" value={selectedLine.manufacturingDate ?? '—'} />
                <DetailField label="Expiry Date" value={selectedLine.expiryDate ?? '—'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Line Items ({lineItems.length})</CardTitle>
                {isDraft && (
                  <Button size="sm" onClick={addLineItemDialog.open} startAdornment={<Plus className="size-4" />}>
                    Add Line Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLineItems ? (
                <div className="text-sm text-muted-foreground">Loading line items…</div>
              ) : lineItems.length === 0 ? (
                <Empty
                  icon={<MapPin />}
                  title="No line items"
                  description="Add line items. Their sum must match line quantity to publish."
                  className="py-8"
                />
              ) : (
                <DataTable table={table} mode="compact" isLoading={isLoadingLineItems} />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-full">
          {isDraft ? (
            <Empty
              icon={<ClipboardList />}
              title="No line selected"
              description="Create or select a line from the left panel."
              className="h-full"
            />
          ) : (
            <Empty
              icon={<ClipboardList />}
              title="No lines"
              description="This adjustment has no lines."
              className="h-full"
            />
          )}
        </div>
      )}

      {selectedLine && (
        <Dialog
          handle={editLineDialog}
          title="Edit Line"
          description="Update line details."
          content={(close) => (
            <EditStockAdjustmentLineDialogForm
              adjustmentId={adjustment.id}
              line={selectedLine}
              isOpeningStock={isOpeningStock}
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      )}

      {selectedLine && (
        <Dialog
          handle={addLineItemDialog}
          title="Add Line Item"
          description="Add a quantity entry for this line."
          content={(close) => (
            <AddLineItemDialogForm
              adjustmentId={adjustment.id}
              lineId={selectedLine.id}
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      )}

      {selectedLine && editingItem && (
        <Dialog
          handle={editLineItemDialog}
          title="Edit Line Item"
          description="Update this line item quantity."
          content={(close) => (
            <EditLineItemDialogForm
              adjustmentId={adjustment.id}
              lineId={selectedLine.id}
              itemId={editingItem.id}
              defaultQuantity={editingItem.quantity}
              onSuccess={() => {
                setEditingItem(null);
                close();
              }}
              onCancel={() => {
                setEditingItem(null);
                close();
              }}
            />
          )}
        />
      )}
    </div>
  );
};
