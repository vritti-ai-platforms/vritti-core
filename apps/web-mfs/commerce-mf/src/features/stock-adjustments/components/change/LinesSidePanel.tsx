import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { ClipboardList, Plus } from 'lucide-react';
import { useStockAdjustmentLines } from '@/hooks/stock-adjustments';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { AddChangeLineDialog } from '../../forms/change/AddChangeLineDialog';

interface LinesSidePanelProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
  selectedLineId: string | null;
  onSelect: (lineId: string | null) => void;
}

export const LinesSidePanel = ({ adjustment, isDraft, selectedLineId, onSelect }: LinesSidePanelProps) => {
  const addLineDialog = useDialog();

  const { data: lines = [], isLoading } = useStockAdjustmentLines(adjustment.id);

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={
          <div className="space-y-1">
            <div className="text-sm font-semibold">Lines</div>
            <div className="text-xs text-muted-foreground">{pluralize('line', lines.length, true)}</div>
          </div>
        }
        actions={
          isDraft ? (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addLineDialog.open}>
              Add Line
            </Button>
          ) : null
        }
        isLoading={isLoading}
        isEmpty={lines.length === 0}
        emptyState={
          <Empty
            icon={<ClipboardList />}
            title="No lines yet"
            description={isDraft ? 'Add a line to start picking serials.' : 'No lines in this adjustment.'}
            action={
              isDraft ? (
                <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addLineDialog.open}>
                  Add Line
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className="p-2 space-y-2">
          {lines.map((line) => {
            const label = [line.quantLotNumber, line.quantLocationName ?? line.quantLocationId].filter(Boolean).join(' @ ') || '—';

            return (
              <SidePanelListItem key={line.id} active={selectedLineId === line.id} onClick={() => onSelect(line.id)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium truncate">{label}</div>
                  <Badge
                    variant={line.isBalanced ? 'success' : 'warning'}
                  >
                    {line.lineItemsCount}/{line.uomQty}
                  </Badge>
                </div>
                {line.quantLocationPath && (
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{line.quantLocationPath}</div>
                )}
                {line.quantAvailableQuantity != null && (
                  <div className="text-xs text-muted-foreground mt-0.5">{line.quantAvailableQuantity} available</div>
                )}
              </SidePanelListItem>
            );
          })}
        </div>
      </PageContentPanel>

      <AddChangeLineDialog
        adjustmentId={adjustment.id}
        inventoryItemId={adjustment.inventoryItemId}
        primaryUomId={adjustment.inventoryItemUomId}
        tracking="serial"
        adjustmentType={adjustment.type}
        handle={addLineDialog}
      />
    </>
  );
};
