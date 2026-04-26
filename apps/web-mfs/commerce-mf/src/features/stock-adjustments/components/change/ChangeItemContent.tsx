import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContent, PageContentDetails } from '@vritti/quantum-ui/PageContent';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  useRemoveStockAdjustmentLine,
  useStockAdjustmentLine,
  useStockAdjustmentLines,
} from '@/hooks/stock-adjustments';
import type { StockAdjustmentData, StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { AddChangeLineDialog } from '../../forms/change/AddChangeLineDialog';
import { EditChangeLineDialog } from '../../forms/change/EditChangeLineDialog';
import { ChangeLinesTable } from './ChangeLinesTable';
import { ConsumeSerialsPanel } from './ConsumeSerialsPanel';

interface ChangeItemContentProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
}

// Two-column: lines table on the left, consume-serials panel on the right.
export const ChangeItemContent = ({ adjustment, isDraft }: ChangeItemContentProps) => {
  const confirm = useConfirm();
  const addLineDialog = useDialog();
  const editLineDialog = useDialog();
  const [editingLine, setEditingLine] = useState<StockAdjustmentLineData | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const { data: lines = [] } = useStockAdjustmentLines(adjustment.id);
  const { data: selectedLine = null } = useStockAdjustmentLine(adjustment.id, selectedLineId);
  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);

  const handleRemove = async (line: StockAdjustmentLineData) => {
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line and any picked serials will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) {
      removeLineMutation.mutate(line.id, {
        onSuccess: () => {
          if (selectedLineId === line.id) setSelectedLineId(null);
        },
      });
    }
  };

  return (
    <PageContent>
      <PageContentDetails>
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
              tracking="serial"
              isDraft={isDraft}
              uomSymbol={adjustment.inventoryItemUomSymbol}
              selectedLineId={selectedLineId}
              onSelect={(line) => setSelectedLineId(line.id)}
              onEdit={(line) => {
                setEditingLine(line);
                editLineDialog.open();
              }}
              onRemove={handleRemove}
              removingLineId={removeLineMutation.isPending ? removeLineMutation.variables ?? null : null}
            />
          </CardContent>
        </Card>

        <AddChangeLineDialog
          adjustmentId={adjustment.id}
          inventoryItemId={adjustment.inventoryItemId}
          tracking="serial"
          handle={addLineDialog}
        />

        <EditChangeLineDialog
          adjustmentId={adjustment.id}
          line={editingLine}
          tracking="serial"
          handle={editLineDialog}
        />
      </PageContentDetails>
      <ConsumeSerialsPanel
        adjustmentId={adjustment.id}
        line={selectedLine}
        isDraft={isDraft}
        uomSymbol={adjustment.inventoryItemUomSymbol}
      />
    </PageContent>
  );
};
