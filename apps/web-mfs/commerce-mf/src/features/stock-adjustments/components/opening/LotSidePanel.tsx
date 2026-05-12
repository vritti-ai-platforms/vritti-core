import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Boxes, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useStockAdjustmentLots } from '@/hooks/stock-adjustments';
import type { StockAdjustmentLotData } from '@/schemas/stock-adjustments';
import { AddLotDialog } from '../../forms/opening/AddLotDialog';

interface LotSidePanelProps {
  adjustmentId: string;
  isDraft: boolean;
  uomSymbol: string;
  selectedLotId: string | null;
  onSelectLot: (lotId: string | null) => void;
}

export const LotSidePanel = ({
  adjustmentId,
  isDraft,
  uomSymbol,
  selectedLotId,
  onSelectLot,
}: LotSidePanelProps) => {
  const { data: lots = [], isLoading } = useStockAdjustmentLots(adjustmentId);
  const addLotDialog = useDialog();

  // Clear the selection if the currently-selected lot no longer exists (e.g., it was deleted).
  // No auto-select on initial load — the right pane shows an Empty asking the user to pick a lot.
  useEffect(() => {
    if (selectedLotId && !lots.some((lot) => lot.id === selectedLotId)) onSelectLot(null);
  }, [lots, selectedLotId, onSelectLot]);

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={
          <div className="space-y-1">
            <div className="text-sm font-semibold">Lots</div>
            <div className="text-xs text-muted-foreground">
              {pluralize('lot', lots.length, true)}
            </div>
          </div>
        }
        actions={
          isDraft ? (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addLotDialog.open}>
              Add Lot
            </Button>
          ) : null
        }
        isLoading={isLoading}
        isEmpty={lots.length === 0}
        emptyState={
          <Empty
            icon={<Boxes />}
            title="No lots"
            description={isDraft ? 'Add the first lot to begin distributing.' : 'No lots in this adjustment.'}
          />
        }
      >
        <div className="p-2 space-y-2">
          {lots.map((lot: StockAdjustmentLotData) => (
            <SidePanelListItem
              key={lot.id}
              active={selectedLotId === lot.id}
              onClick={() => onSelectLot(lot.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{lot.lotNumber}</div>
                <Badge variant="secondary" className="shrink-0 bg-success/15 text-success">
                  {lot.totalQuantity} {uomSymbol}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {pluralize('line', lot.linesCount, true)}
                {lot.expiryDate ? (
                  <>
                    {' • exp '}
                    <FormattedDate value={lot.expiryDate} dateOnly />
                  </>
                ) : null}
              </div>
            </SidePanelListItem>
          ))}
        </div>
      </PageContentPanel>

      <AddLotDialog adjustmentId={adjustmentId} handle={addLotDialog} />
    </>
  );
};
