import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { ClipboardList, Plus } from 'lucide-react';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (!selectedLineId) return;
    if (!lines.some((line) => line.id === selectedLineId)) {
      onSelectLine(null);
    }
  }, [lines, selectedLineId, onSelectLine]);

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={`Lines (${lines.length})`}
        isLoading={isLoadingLines}
        contentClassName={!isLoadingLines && lines.length === 0 ? 'flex items-center justify-center p-3' : undefined}
        actions={
          isDraft ? (
            <Button size="sm" onClick={addLineDialog.open} startAdornment={<Plus className="size-4" />}>
              Add Line
            </Button>
          ) : null
        }
        content={
          lines.length === 0 ? (
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
                const lineLabel = isOpeningStock ? line.locationName : `Batch #${line.batchNumber}`;
                return (
                  <SidePanelListItem key={line.id} active={active} onClick={() => onSelectLine(line.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium truncate">{lineLabel}</div>
                      <Badge variant={line.isLineItemsBalanced ? 'secondary' : 'destructive'}>
                        {line.lineItemsQuantitySum}/{line.quantity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Items: {line.lineItemsCount} {line.isLineItemsBalanced ? '• Balanced' : `• Not balanced`}
                    </div>
                  </SidePanelListItem>
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
