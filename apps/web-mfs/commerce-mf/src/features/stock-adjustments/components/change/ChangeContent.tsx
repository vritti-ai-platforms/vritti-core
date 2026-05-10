import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  useRemoveStockAdjustmentLine,
  useStockAdjustmentLines,
} from '@/hooks/stock-adjustments';
import type {
  InventoryTracking,
  StockAdjustmentData,
  StockAdjustmentLineData,
} from '@/schemas/stock-adjustments';
import { AddChangeLineDialog } from '../../forms/change/AddChangeLineDialog';
import { EditChangeLineDialog } from '../../forms/change/EditChangeLineDialog';
import { ChangeLinesTable } from './ChangeLinesTable';

interface ChangeContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
  tracking: Extract<InventoryTracking, 'quantity' | 'lot'>;
}

// Single full-width lines table for tracking='quantity' or 'lot' deductions/corrections.
export const ChangeContent = ({ adjustment, isDraft, tracking }: ChangeContentProps) => {
  const confirm = useConfirm();
  const addLineDialog = useDialog();
  const editLineDialog = useDialog();
  const [editingLine, setEditingLine] = useState<StockAdjustmentLineData | null>(null);

  const { data: lines = [] } = useStockAdjustmentLines(adjustment.id);
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);

  const handleRemove = async (line: StockAdjustmentLineData) => {
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLineMutation.mutate(line.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Lines ({lines.length})</CardTitle>
          {isDraft && (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addLineDialog.open}>
              Add Line
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChangeLinesTable
          lines={lines}
          tracking={tracking}
          isDraft={isDraft}
          uomSymbol={adjustment.inventoryItemUomSymbol}
          onEdit={(line) => {
            setEditingLine(line);
            editLineDialog.open();
          }}
          onRemove={handleRemove}
          removingLineId={removeLineMutation.isPending ? removeLineMutation.variables ?? null : null}
        />

        <AddChangeLineDialog
          adjustmentId={adjustment.id}
          inventoryItemId={adjustment.inventoryItemId}
          primaryUomId={adjustment.inventoryItemUomId}
          tracking={tracking}
          handle={addLineDialog}
        />

        <EditChangeLineDialog
          adjustmentId={adjustment.id}
          inventoryItemId={adjustment.inventoryItemId}
          line={editingLine}
          tracking={tracking}
          handle={editLineDialog}
        />
      </CardContent>
    </Card>
  );
};
