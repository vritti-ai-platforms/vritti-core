import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { ClipboardList, Plus } from 'lucide-react';
import { useStockAdjustmentLines } from '@/hooks/stock-adjustments';
import type { StockAdjustmentType } from '@/schemas/stock-adjustments';
import { AddStockAdjustmentLineDialog } from '../forms/AddStockAdjustmentLineDialog';

interface StockAdjustmentSidePanelProps {
  adjustmentId: string;
  adjustmentType: StockAdjustmentType;
  inventoryItemId: string;
  selectedLineId: string | null;
  isOpeningStock: boolean;
  isDraft: boolean;
  onSelectLine: (lineId: string | null) => void;
}

export const StockAdjustmentSidePanel = ({
  adjustmentId,
  adjustmentType,
  inventoryItemId,
  selectedLineId,
  isOpeningStock,
  isDraft,
  onSelectLine,
}: StockAdjustmentSidePanelProps) => {
  const addLineDialog = useDialog();
  const { data: lines = [], isLoading: isLoadingLines } = useStockAdjustmentLines(adjustmentId);

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={`Lines (${lines.length})`}
        options={
          isDraft ? (
            <Button size="sm" onClick={addLineDialog.open} startAdornment={<Plus className="size-4" />}>
              Add Line
            </Button>
          ) : null
        }
        content={
          isLoadingLines ? (
            <div className="p-4 text-sm text-muted-foreground">Loading lines…</div>
          ) : lines.length === 0 ? (
            <Empty
              icon={<ClipboardList />}
              title="No lines"
              description={isDraft ? 'Create a line from this panel.' : 'This adjustment has no lines.'}
              className="py-12"
            />
          ) : (
            <div className="p-2 space-y-2">
              {lines.map((line) => {
                const active = selectedLineId === line.id;
                return (
                  <button
                    type="button"
                    key={line.id}
                    className={`w-full rounded-md border px-3 py-2 text-left ${active ? 'bg-accent border-accent' : 'hover:bg-accent/40'}`}
                    onClick={() => onSelectLine(line.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium truncate">
                        {isOpeningStock
                          ? (line.locationName ?? 'No location')
                          : line.batchNumber
                            ? `Batch #${line.batchNumber}`
                            : 'No batch'}
                      </div>
                      <Badge variant={line.isLineItemsBalanced ? 'secondary' : 'destructive'}>
                        {line.lineItemsQuantitySum}/{line.quantity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Items: {line.lineItemsCount}{' '}
                      {line.isLineItemsBalanced ? '• Balanced' : `• Delta ${line.lineItemsDelta}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        }
      />
      <Dialog
        handle={addLineDialog}
        title="Add Line"
        description={
          isOpeningStock
            ? 'Add a new opening stock entry with location and quantity.'
            : 'Select a batch and specify the adjustment quantity.'
        }
        content={(close) => (
          <AddStockAdjustmentLineDialog
            adjustmentId={adjustmentId}
            adjustmentType={adjustmentType}
            inventoryItemId={inventoryItemId}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
