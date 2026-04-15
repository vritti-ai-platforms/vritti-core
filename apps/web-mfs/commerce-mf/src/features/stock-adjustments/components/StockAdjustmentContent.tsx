import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { useRemoveStockAdjustmentLine, useStockAdjustmentLine } from '@/hooks/stock-adjustments';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { EditStockAdjustmentLineDialogForm } from '../forms/EditStockAdjustmentLineDialogForm';
import { StockAdjustmentLineItemsTable } from './StockAdjustmentLineItemsTable';

interface StockAdjustmentContentProps {
  adjustment: StockAdjustmentData;
  selectedLineId: string | null;
  isDraft: boolean;
  isOpeningStock: boolean;
  onSelectLine: (lineId: string | null) => void;
}

export const StockAdjustmentContent = ({
  adjustment,
  selectedLineId,
  isDraft,
  isOpeningStock,
  onSelectLine,
}: StockAdjustmentContentProps) => {
  const confirm = useConfirm();
  const editLineDialog = useDialog();

  const { data: selectedLine } = useStockAdjustmentLine(adjustment.id, selectedLineId);

  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);

  async function handleRemoveLine(lineId: string) {
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line and its line items will be removed from the adjustment.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) {
      removeLineMutation.mutate(lineId, {
        onSuccess: () => onSelectLine(null),
      });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {selectedLine ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Line</h3>
              <Badge variant={selectedLine.isLineItemsBalanced ? 'secondary' : 'destructive'}>
                {selectedLine.isLineItemsBalanced ? 'Balanced' : 'Not Balanced'}
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
                  isLoading={removeLineMutation.isPending}
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

          <div>
            <StockAdjustmentLineItemsTable adjustmentId={adjustment.id} lineId={selectedLine.id} isDraft={isDraft} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Empty
            icon={<ClipboardList />}
            title="No line selected"
            description="Create or select a line from the left panel."
            className="py-8"
          />
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
    </div>
  );
};
